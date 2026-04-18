"""
Flask Backend for Turing Machine Language Recognizer
API endpoint for simulating Turing Machine on palindrome language
"""

from flask import Flask, render_template, request, jsonify
from turing_machine import TuringMachineFactory

app = Flask(__name__)

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')

@app.route('/simulate', methods=['POST'])
def simulate():
    """
    API endpoint for running Turing Machine simulation
    Expected JSON: {"input": "string_to_test"}
    Returns: {"result": "ACCEPT/REJECT", "steps": [...]}
    """
    try:
        data = request.get_json()
        input_string = data.get('input', '')
        language = data.get('language', 'palindrome')
        
        # Validate empty string handling (TM might accept it, but backend needs to process it)
        if not input_string and language not in ['an_bn', 'an_bn_cn', 'equal_01']: 
            pass # allow for an_bn, an_bn_cn, equal_01 which can accept empty string
            
        # Run simulation
        tm = TuringMachineFactory.get_machine(language)
        result, steps = tm.simulate(input_string)
        
        return jsonify({
            'result': result,
            'steps': steps,
            'total_steps': len(steps) - 1
        })
    
    except Exception as e:
        return jsonify({
            'result': 'ERROR',
            'error': str(e),
            'steps': []
        }), 500

@app.route('/info', methods=['GET'])
def info():
    """Return information about the Turing Machine"""
    language = request.args.get('language', 'palindrome')
    tm = TuringMachineFactory.get_machine(language)
    
    return jsonify({
        'machine_name': language,
        'alphabet': list(tm.alphabet),
        'states': list(tm.states),
        'accept_state': tm.accept_state,
        'reject_state': tm.reject_state,
        'description': tm.description
    })

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
