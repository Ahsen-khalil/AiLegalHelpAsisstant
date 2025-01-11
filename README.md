AI Assistance in Legal Help
Project Overview
This project is an AI-powered web application designed to assist users with legal queries by providing relevant information based on the Constitution of Pakistan, Code of Criminal Procedure (CrPC), and Pakistan Penal Code (PPC). Users can ask legal questions or describe scenarios, and the AI will return relevant sections and articles from these legal documents.
________________________________________
Features
•	Legal Document Parsing: Automatically processes and indexes legal documents in PDF format.
•	AI-Powered Query Handling: Uses advanced machine learning models to interpret user queries and provide contextually accurate answers.
•	Interactive Web Interface: A user-friendly interface for seamless interaction.
•	Modular Structure: Organized codebase with separation of concerns for scalability and maintainability.
________________________________________
Directory Structure
•	chromadb/: Stores vector embeddings for fast document retrieval.
•	data/: Contains the legal documents (Constitution.pdf, Code_of_criminal_procedure_1898.pdf, PPC.pdf).
•	myenv/: Virtual environment for Python dependencies (not included in GitHub, use .gitignore to exclude this folder).
•	static/:
o	css/styles.css: Contains styling for the web interface.
o	js/scripts.js: Handles client-side interactions.
•	templates/:
o	index.html: HTML file for the application's front-end.
•	Project files:
o	app.py: Flask application file to manage the server and routes.
o	chatbot.py: Core logic for AI-powered legal assistance.
o	ui.py: Handles UI-related functionality.
o	requirements.txt: Python dependencies for the project.
o	.env: Environment variables for sensitive information like API keys.
o	vercel.json: Configuration for deploying the app to Vercel.
________________________________________
How to Run the Project
1. Clone the Repository
“git clone https://github.com/yourusername/yourrepositoryname.git
cd yourrepositoryname”

2. Set Up the Virtual Environment
“python -m venv myenv
source myenv/bin/activate  # On Windows: myenv\Scripts\activate”

3. Install Dependencies
“pip install -r requirements.txt”

4. Add Legal Documents
Ensure the PDFs are placed in the data/ directory.


5. Configure Environment Variables
Create a .env file and add the following:
-makefile
-OPENAI_API_KEY=your_openai_api_key
6. Run the Application
“python app.py”
The application will run at http://127.0.0.1:5000.
________________________________________
Deployment
The project is configured for deployment on Vercel. Ensure the vercel.json file is properly set up and use the Vercel CLI for deployment:
“vercel deploy”
________________________________________
Project Dependencies
•	Framework: Flask
•	Database: MongoDB
•	Frontend: HTML, CSS, JavaScript
•	AI/ML Tools: LangChain, OpenAI APIs
•	Vector Database: Chroma
•	PDF Parsing: PyPDFLoader
________________________________________
Contributors
•	Ahsen Khalil
•	Irfan
________________________________________
Acknowledgments
Special thanks to our instructor for guidance and support throughout this project.
________________________________________

Feedback

Feel free to open issues or create pull requests for any suggestions or improvements!
________________________________________

License
This project is licensed under the MIT License.

