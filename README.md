# Language Recognition using Turing Machine

A web-based Turing Machine simulator built with Flask and JavaScript for visualizing and simulating language recognition.

## Supported Languages
1. **Palindrome**: Recognizes strings that read the same backwards and forwards over `{a, b}`.
2. **Even number of 1s**: Recognizes strings with an even number of `1`s over `{0, 1}`.
3. **a^n b^n**: Recognizes strings with an equal number of `a`s followed by `b`s.
4. **a^n b^n c^n**: Recognizes strings with an equal number of `a`s, `b`s, and `c`s.
5. **Equal number of 0s and 1s**: Recognizes strings with an equal number of `0`s and `1`s in any order.

## Features
- Interactive head movement and tape simulation.
- Real-time step logging and execution steps tracking.
- Dynamic dropdown to switch between Turing Machine models seamlessly.

## Getting Started

### Prerequisites
- Python 3.x
- Flask

### Installation & Run
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the Flask server:
   ```bash
   python app.py
   ```
3. Open your browser and navigate to `http://localhost:5000`
