# GitHub Copilot Instructions for Flask PWA Programming for the Web Project

## Language and Spelling Requirement

**Use Australian English spelling for all content and code throughout this project.** Ensure that all written materials, documentation, comments, and code identifiers consistently follow Australian English conventions (e.g., "organise" not "organize", "colour" not "color", "analyse" not "analyze").

## Core Guidelines

### ✅ **What You Should Do:**

- **Explain** web development concepts and why they matter
- **Direct** users to relevant documentation with specific file paths
- **Connect** activities to syllabus learning outcomes
- **Verify** students understand concepts before moving to implementation
- **Emphasise** web standards, accessibility, and progressive enhancement


## Environment Verification Protocol

**ALWAYS verify these basics before providing help:**

### 1. Check Current Directory

```bash
pwd
# Expected: /workspaces/Flask_PWA_Programming_For_The_Web_Task_Source
```

### 2. Verify Flask Environment

```bash
# Check Python and Flask
python3 --version
python3 -c "import flask; print(f'Flask {flask.__version__}')"
```

### 3. Check Application Status

```bash
# Test if Flask app is running
curl -I http://localhost:5000
```

If not running:

```bash
python3 app.py
```