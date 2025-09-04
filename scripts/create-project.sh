#!/bin/bash

# BUDA Project Creator
# Creates a new project from the BUDA template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}%s${NC}\n" "$2"
}

print_header() {
    echo "======================================"
    print_color $BLUE "🏗️  BUDA Project Creator"
    print_color $BLUE "Boss Rules Development Architecture"
    echo "======================================"
}

print_usage() {
    echo "Usage: $0 <project-name> [project-description]"
    echo ""
    echo "Examples:"
    echo "  $0 my-awesome-app"
    echo "  $0 todo-manager 'A simple todo management application'"
    echo ""
}

# Check arguments
if [ $# -lt 1 ]; then
    print_usage
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DESCRIPTION="${2:-A BUDA-powered application with Boss Rules architecture}"

# Validate project name
if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z][a-zA-Z0-9-]*$ ]]; then
    print_color $RED "❌ Error: Project name must start with a letter and contain only letters, numbers, and hyphens"
    exit 1
fi

# Check if directory already exists
if [ -d "$PROJECT_NAME" ]; then
    print_color $RED "❌ Error: Directory '$PROJECT_NAME' already exists"
    exit 1
fi

print_header

print_color $YELLOW "📝 Creating project: $PROJECT_NAME"
print_color $YELLOW "📄 Description: $PROJECT_DESCRIPTION"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BUDA_DIR="$( dirname "$SCRIPT_DIR" )"
TEMPLATE_DIR="$BUDA_DIR/template"

# Check if template directory exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    print_color $RED "❌ Error: BUDA template directory not found at $TEMPLATE_DIR"
    exit 1
fi

# Copy template
print_color $BLUE "📂 Copying BUDA template..."
cp -r "$TEMPLATE_DIR" "$PROJECT_NAME"

# Navigate to project directory
cd "$PROJECT_NAME"

# Replace template variables in package.json
print_color $BLUE "🔧 Configuring project settings..."
sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" package.json
sed -i '' "s/{{PROJECT_DESCRIPTION}}/$PROJECT_DESCRIPTION/g" package.json

# Make tools executable
chmod +x tools/*.ts

# Initialize git if not already in a git repository
if [ ! -d ".git" ]; then
    print_color $BLUE "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: BUDA project setup

    🏗️ Architecture: 4-Bus LEGO system
    🔧 Tooling: Boss Rules enforcement
    📋 Process: Design-first TDD workflow
    
    Generated with BUDA v1.0.0"
fi

# Install dependencies
print_color $BLUE "📦 Installing dependencies..."
npm install --silent

# Run initial validation
print_color $BLUE "✅ Running initial validation..."
if npm run boss:validate --silent; then
    print_color $GREEN "✅ All Boss Rules validation passed!"
else  
    print_color $YELLOW "⚠️  Some validation warnings (normal for new project)"
fi

echo ""
print_color $GREEN "🎉 Project '$PROJECT_NAME' created successfully!"
echo ""
print_color $BLUE "Next steps:"
echo "  1. cd $PROJECT_NAME"
echo "  2. npm run dev              # Start development"
echo "  3. Read docs/SETUP.md       # Setup guide"
echo "  4. Read docs/ARCHITECTURE.md # Architecture guide"
echo "  5. Read docs/WORKFLOW.md    # Development workflow"
echo ""
print_color $BLUE "Available commands:"
echo "  npm run dev                 # Start development server"
echo "  npm run boss:validate       # Check Boss Rules compliance"  
echo "  npm run budget             # Check complexity budget"
echo "  npm run delete-simulation   # Test deletion resilience"
echo "  npm run test               # Run test suite"
echo ""
print_color $YELLOW "🚀 Happy coding with Boss Rules discipline!"