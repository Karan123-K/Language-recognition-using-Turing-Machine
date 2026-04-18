"""
Turing Machine Module for Multiple Languages
"""

class TuringMachine:
    def __init__(self, states, alphabet, tape_symbols, transitions, accept_state, reject_state, description=""):
        self.states = states
        self.alphabet = alphabet
        self.tape_symbols = tape_symbols
        self.transitions = transitions
        self.accept_state = accept_state
        self.reject_state = reject_state
        self.description = description
    
    def validate_input(self, input_string):
        """Validate that input only contains allowed alphabet"""
        for char in input_string:
            if char not in self.alphabet:
                return False
        return True
    
    def simulate(self, input_string):
        """
        Simulate the Turing Machine on the given input string
        Returns: (result, steps_list)
        """
        if not self.validate_input(input_string):
            return 'REJECT', [{'error': f'Invalid input: only {", ".join(self.alphabet)} allowed'}]
        
        tape = list(input_string) + ['B']
        head_pos = 0
        current_state = 'q0'
        
        # If no input provided but machine accepts empty string directly
        if len(input_string) == 0:
            if ('q0', 'B') in self.transitions:
                tape = ['B'] # Just blank
            else:
                return 'REJECT', [{'error': 'Empty input rejected'}]

        steps = []
        step_count = 0
        max_steps = 10000
        
        steps.append({
            'step': step_count,
            'state': current_state,
            'tape': ''.join(tape),
            'head_pos': head_pos,
            'action': 'Initial state'
        })
        
        while current_state not in [self.accept_state, self.reject_state]:
            step_count += 1
            if step_count > max_steps:
                return 'REJECT', steps + [{'error': 'Max steps exceeded'}]
            
            if head_pos < 0: head_pos = 0
            if head_pos >= len(tape): head_pos = len(tape) - 1
            
            current_symbol = tape[head_pos]
            transition_key = (current_state, current_symbol)
            
            if transition_key not in self.transitions:
                current_state = self.reject_state
                steps.append({
                    'step': step_count,
                    'state': current_state,
                    'tape': ''.join(tape),
                    'head_pos': head_pos,
                    'action': f'No transition for ({current_state}, {current_symbol})'
                })
                break
            
            next_state, write_symbol, move = self.transitions[transition_key]
            tape[head_pos] = write_symbol
            
            if move == 'L':
                if head_pos > 0: head_pos -= 1
                current_state = next_state
            elif move == 'R':
                head_pos += 1
                if head_pos >= len(tape): tape.append('B')
                current_state = next_state
            elif move == 'S':
                current_state = next_state
            
            steps.append({
                'step': step_count,
                'state': current_state,
                'tape': ''.join(tape),
                'head_pos': max(0, head_pos),
                'action': f'Read: {current_symbol}, Write: {write_symbol}, Move: {move}'
            })
        
        result = 'ACCEPT' if current_state == self.accept_state else 'REJECT'
        return result, steps

class TuringMachineFactory:
    @staticmethod
    def get_machine(language):
        if language == 'palindrome':
            return TuringMachineFactory.create_palindrome()
        elif language == 'even_1s':
            return TuringMachineFactory.create_even_1s()
        elif language == 'an_bn':
            return TuringMachineFactory.create_an_bn()
        elif language == 'an_bn_cn':
            return TuringMachineFactory.create_an_bn_cn()
        elif language == 'equal_01':
            return TuringMachineFactory.create_equal_01()
        else:
            return TuringMachineFactory.create_palindrome()

    @staticmethod
    def create_palindrome():
        transitions = {
            ('q0', 'a'): ('q4', 'B', 'R'),
            ('q0', 'b'): ('q1', 'B', 'R'),
            ('q0', 'B'): ('qf', 'B', 'S'),
            ('q1', 'a'): ('q1', 'a', 'R'),
            ('q1', 'b'): ('q1', 'b', 'R'),
            ('q1', 'B'): ('q2', 'B', 'L'),
            ('q2', 'b'): ('q3', 'B', 'L'),
            ('q2', 'B'): ('qf', 'B', 'S'),
            ('q4', 'a'): ('q4', 'a', 'R'),
            ('q4', 'b'): ('q4', 'b', 'R'),
            ('q4', 'B'): ('q5', 'B', 'L'),
            ('q5', 'a'): ('q3', 'B', 'L'),
            ('q5', 'B'): ('qf', 'B', 'S'),
            ('q3', 'a'): ('q3', 'a', 'L'),
            ('q3', 'b'): ('q3', 'b', 'L'),
            ('q3', 'B'): ('q0', 'B', 'R'),
        }
        return TuringMachine(
            states={'q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'qf'},
            alphabet={'a', 'b'},
            tape_symbols={'a', 'b', 'B'},
            transitions=transitions,
            accept_state='qf',
            reject_state='qrej',
            description="Recognizes palindromes over {a, b}"
        )

    @staticmethod
    def create_even_1s():
        transitions = {
            ('q0', '0'): ('q0', '0', 'R'),
            ('q0', '1'): ('q1', '1', 'R'),
            ('q0', 'B'): ('qf', 'B', 'S'),
            ('q1', '0'): ('q1', '0', 'R'),
            ('q1', '1'): ('q0', '1', 'R'),
        }
        return TuringMachine(
            states={'q0', 'q1', 'qf'},
            alphabet={'0', '1'},
            tape_symbols={'0', '1', 'B'},
            transitions=transitions,
            accept_state='qf',
            reject_state='qrej',
            description="Recognizes strings with an even number of 1s over {0, 1}"
        )

    @staticmethod
    def create_an_bn():
        transitions = {
            ('q0', 'a'): ('q1', 'X', 'R'),
            ('q0', 'Y'): ('q3', 'Y', 'R'),
            ('q0', 'B'): ('qf', 'B', 'S'),
            ('q1', 'a'): ('q1', 'a', 'R'),
            ('q1', 'Y'): ('q1', 'Y', 'R'),
            ('q1', 'b'): ('q2', 'Y', 'L'),
            ('q2', 'Y'): ('q2', 'Y', 'L'),
            ('q2', 'a'): ('q2', 'a', 'L'),
            ('q2', 'X'): ('q0', 'X', 'R'),
            ('q3', 'Y'): ('q3', 'Y', 'R'),
            ('q3', 'B'): ('qf', 'B', 'S'),
        }
        return TuringMachine(
            states={'q0', 'q1', 'q2', 'q3', 'qf'},
            alphabet={'a', 'b'},
            tape_symbols={'a', 'b', 'X', 'Y', 'B'},
            transitions=transitions,
            accept_state='qf',
            reject_state='qrej',
            description="Recognizes a^n b^n for n >= 0"
        )

    @staticmethod
    def create_an_bn_cn():
        transitions = {
            ('q0', 'a'): ('q1', 'X', 'R'),
            ('q0', 'Y'): ('q4', 'Y', 'R'),
            ('q0', 'B'): ('qf', 'B', 'S'),
            ('q1', 'a'): ('q1', 'a', 'R'),
            ('q1', 'Y'): ('q1', 'Y', 'R'),
            ('q1', 'b'): ('q2', 'Y', 'R'),
            ('q2', 'b'): ('q2', 'b', 'R'),
            ('q2', 'Z'): ('q2', 'Z', 'R'),
            ('q2', 'c'): ('q3', 'Z', 'L'),
            ('q3', 'Z'): ('q3', 'Z', 'L'),
            ('q3', 'b'): ('q3', 'b', 'L'),
            ('q3', 'Y'): ('q3', 'Y', 'L'),
            ('q3', 'a'): ('q3', 'a', 'L'),
            ('q3', 'X'): ('q0', 'X', 'R'),
            ('q4', 'Y'): ('q4', 'Y', 'R'),
            ('q4', 'Z'): ('q4', 'Z', 'R'),
            ('q4', 'B'): ('qf', 'B', 'S'),
        }
        return TuringMachine(
            states={'q0', 'q1', 'q2', 'q3', 'q4', 'qf'},
            alphabet={'a', 'b', 'c'},
            tape_symbols={'a', 'b', 'c', 'X', 'Y', 'Z', 'B'},
            transitions=transitions,
            accept_state='qf',
            reject_state='qrej',
            description="Recognizes a^n b^n c^n for n >= 0"
        )

    @staticmethod
    def create_equal_01():
        transitions = {
            ('q0', '0'): ('q1', 'A', 'R'),
            ('q0', '1'): ('q2', 'A', 'R'),
            ('q0', 'C'): ('q0', 'C', 'R'),
            ('q0', 'A'): ('q0', 'A', 'R'),
            ('q0', 'B'): ('qf', 'B', 'S'),
            ('q1', '0'): ('q1', '0', 'R'),
            ('q1', 'C'): ('q1', 'C', 'R'),
            ('q1', 'A'): ('q1', 'A', 'R'),
            ('q1', '1'): ('q_ret', 'C', 'L'),
            ('q2', '1'): ('q2', '1', 'R'),
            ('q2', 'C'): ('q2', 'C', 'R'),
            ('q2', 'A'): ('q2', 'A', 'R'),
            ('q2', '0'): ('q_ret', 'C', 'L'),
            ('q_ret', '0'): ('q_ret', '0', 'L'),
            ('q_ret', '1'): ('q_ret', '1', 'L'),
            ('q_ret', 'C'): ('q_ret', 'C', 'L'),
            ('q_ret', 'A'): ('q0', 'A', 'R'),
        }
        
        return TuringMachine(
            states={'q0', 'q1', 'q2', 'q_ret', 'qf'},
            alphabet={'0', '1'},
            tape_symbols={'0', '1', 'A', 'C', 'B'},
            transitions=transitions,
            accept_state='qf',
            reject_state='qrej',
            description="Recognizes strings with an equal number of 0s and 1s"
        )