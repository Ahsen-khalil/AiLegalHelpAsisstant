from flask import Flask, render_template, request, jsonify, session
from chatbot import chain  # Import your existing backend code
import uuid
import re
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Replace with a real secret key

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')  # Replace with your MongoDB URI
db = client['chatbot']  # Database name
conversations_collection = db['chatss']  # Collection for storing conversations

@app.route('/')
def index():
    # Generate a unique user ID if not already present in the session
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    conversation_id = request.json.get('conversation_id') or str(uuid.uuid4())

    # Retrieve the conversation from MongoDB
    conversation = conversations_collection.find_one({'conversation_id': conversation_id})
    history = conversation['messages'] if conversation else []

    # Prepare the context for the chatbot by combining the conversation history
    context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    context += f"\nuser: {user_message}"

    # Generate chatbot response using context
    raw_response = chain.invoke(context)

    # Format the chatbot's response
    structured_response = format_response(raw_response)

    # Save the new message pair (user + bot) to the conversation in MongoDB
    save_conversation(conversation_id, user_message, structured_response)

    return jsonify({
        'response': structured_response,
        'conversation_id': conversation_id
    })


def format_response(response):
    """
    Formats the chatbot response:
    - Adds bullet points where needed.
    - Starts each bullet point on a new line.
    - Ensures each sentence starts on a new line.
    - Provides proper indentation and structure for readability.
    """
    formatted_lines = []
    
    # Split the response into sentences or list-like structures
    lines = re.split(r'(?<=[.!?]) +', response.strip())  # Split by sentence boundaries
    
    for line in lines:
        if re.match(r'^\d+\.', line.strip()) or re.match(r'^[-•]', line.strip()):  # Detect lists like "1.", "-", or "•"
            formatted_lines.append(f"- {line.strip()}")
        else:
            formatted_lines.append(line.strip())
    
    # Ensure final formatting with each element on a new line
    structured_response = "\n".join(formatted_lines)
    return structured_response

def save_conversation(conversation_id, user_message, bot_response):
    """
    Save the conversation to MongoDB.
    """
    # Check if the conversation already exists
    conversation = conversations_collection.find_one({'conversation_id': conversation_id})
    
    if not conversation:
        # Create a new conversation document if not found
        conversations_collection.insert_one({
            'conversation_id': conversation_id,
            'messages': [
                {'role': 'user', 'content': user_message},
                {'role': 'bot', 'content': bot_response}
            ]
        })
    else:
        # Append new messages to the existing conversation
        conversations_collection.update_one(
            {'conversation_id': conversation_id},
            {'$push': {'messages': {'role': 'user', 'content': user_message}}}
        )
        conversations_collection.update_one(
            {'conversation_id': conversation_id},
            {'$push': {'messages': {'role': 'bot', 'content': bot_response}}}
        )

@app.route('/create_conversation', methods=['POST'])
def create_conversation():
    try:
        # Create a new unique conversation ID
        conversation_id = str(uuid.uuid4())
        
        # Create a new conversation entry in the MongoDB database
        conversation = {
            "conversation_id": conversation_id,
            "messages": []
        }
        # Insert the conversation into the MongoDB collection
        conversations_collection.insert_one(conversation)
        
        # Return the response with the new conversation ID
        return jsonify({"conversation_id": conversation_id}), 200
    except Exception as e:
        # Handle errors if any occur during conversation creation
        return jsonify({"error": str(e)}), 500

@app.route('/get_conversations', methods=['GET'])
def get_conversations():
    """
    Retrieve all conversations from MongoDB.
    """
    conversations = list(conversations_collection.find({}))
    formatted_conversations = [{
        'conversation_id': conv['conversation_id'],
        'messages': conv['messages']
    } for conv in conversations]
    return jsonify({'conversations': formatted_conversations})

@app.route('/delete_conversation', methods=['DELETE'])
def delete_conversation():
    """
    Delete a specific conversation from MongoDB.
    """
    conversation_id = request.json.get('conversation_id')
    if not conversation_id:
        return jsonify({'error': 'Conversation ID is required'}), 400

    result = conversations_collection.delete_one({'conversation_id': conversation_id})
    if result.deleted_count > 0:
        return jsonify({'message': 'Conversation deleted successfully'}), 200
    else:
        return jsonify({'error': 'Conversation not found'}), 404
    



if __name__ == '__main__':
    app.run(debug=True)
