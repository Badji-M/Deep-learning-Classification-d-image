#!/bin/bash

# FlipClass Deployment Script for Render
# This script prepares the project for deployment

echo "FlipClass Deployment Preparation"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Git not initialized. Initializing..."
    git init
else
    echo "Git repository found"
fi

# Check if files are committed
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "Uncommitted changes found:"
    git status --short
    echo ""
    read -p "Stage all changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " message
        git commit -m "$message"
    fi
else
    echo "Working tree is clean"
fi

# Check if remote is configured
if git remote | grep -q "origin"; then
    echo "Remote 'origin' already configured"
else
    echo ""
    echo "No remote configured. Please run:"
    echo "git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git"
    exit 1
fi

echo ""
echo "Deployment files ready:"
echo "  - render.yaml (Render configuration)"
echo "  - DEPLOYMENT.md (Deployment guide)"
echo "  - .env.example (Environment variables template)"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push -u origin main"
echo "2. Go to https://dashboard.render.com"
echo "3. Create new services for backend and frontend"
echo "4. Set environment variables as per DEPLOYMENT.md"
echo ""
echo "Done!"
