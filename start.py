#!/usr/bin/env python3
import subprocess
import sys
import threading
import time
import os

def run_backend():
    """Run the FastAPI backend server"""
    print("Starting FastAPI backend on http://localhost:8000")
    subprocess.run([sys.executable, "backend.py"])

def run_frontend():
    """Run the React frontend development server"""
    print("Starting React frontend on http://localhost:3000")
    os.chdir("frontend")
    subprocess.run(["npm", "start"])

def main():
    print("🚀 Starting RAG Web Application")
    print("=" * 50)
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend, daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    # Start frontend (this will block)
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down application...")
        sys.exit(0)

if __name__ == "__main__":
    main()