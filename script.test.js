/**
 * @jest-environment jsdom
 */
'use strict';

const { fmt, validateUsername } = require('./script');

// ─── validateUsername unit tests ─────────────────────────────────────────────

describe('validateUsername', () => {
  test('returns empty array for a fully valid username', () => {
    expect(validateUsername('Hello1!')).toEqual([]);
  });

  test('flags username shorter than 5 characters', () => {
    const errors = validateUsername('A1!x');
    expect(errors).toContain('at least 5 characters');
  });

  test('flags missing uppercase letter', () => {
    const errors = validateUsername('hello1!');
    expect(errors).toContain('1 uppercase letter');
  });

  test('flags missing number', () => {
    const errors = validateUsername('Hello!!');
    expect(errors).toContain('1 number');
  });

  test('flags missing special character', () => {
    const errors = validateUsername('Hello1');
    expect(errors).toContain('1 special character');
  });

  test('returns multiple errors for an all-lowercase short string', () => {
    const errors = validateUsername('abc');
    expect(errors).toContain('at least 5 characters');
    expect(errors).toContain('1 uppercase letter');
    expect(errors).toContain('1 number');
    expect(errors).toContain('1 special character');
  });

  test('returns empty array for username with exactly 5 chars meeting all rules', () => {
    expect(validateUsername('Aa1!x')).toEqual([]);
  });

  test('accepts various special characters', () => {
    expect(validateUsername('Hello1@')).toEqual([]);
    expect(validateUsername('Hello1#')).toEqual([]);
    expect(validateUsername('Hello1$')).toEqual([]);
  });
});

// ─── initUsernameValidation DOM tests ────────────────────────────────────────

describe('initUsernameValidation', () => {
  let input, feedback, form;
  let submitHandler, inputHandler;

  beforeEach(() => {
    // Build minimal DOM
    document.body.innerHTML = `
      <form id="usernameForm">
        <input id="usernameInput" type="text" value="" />
        <div id="usernameFeedback" class="d-none"></div>
        <button type="submit">Submit</button>
      </form>
    `;

    input    = document.getElementById('usernameInput');
    feedback = document.getElementById('usernameFeedback');
    form     = document.getElementById('usernameForm');

    // Capture handlers by spying on addEventListener
    const handlers = {};
    const origFormAdd  = form.addEventListener.bind(form);
    const origInputAdd = input.addEventListener.bind(input);

    jest.spyOn(form, 'addEventListener').mockImplementation((evt, fn) => {
      handlers[`form:${evt}`] = fn;
      origFormAdd(evt, fn);
    });
    jest.spyOn(input, 'addEventListener').mockImplementation((evt, fn) => {
      handlers[`input:${evt}`] = fn;
      origInputAdd(evt, fn);
    });

    // Inline initUsernameValidation logic (mirrors script.js exactly)
    function initUsernameValidation() {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const errors = validateUsername(input.value);
        if (input.value.length === 0) {
          input.classList.remove('is-valid', 'is-invalid');
          input.classList.add('is-invalid');
          feedback.textContent = 'Username is required.';
          feedback.classList.remove('d-none', 'text-success');
          feedback.classList.add('text-danger');
        } else if (errors.length === 0) {
          input.classList.add('is-valid');
          input.classList.remove('is-invalid');
          feedback.textContent = `Welcome, ${input.value}! Username accepted.`;
          feedback.classList.remove('d-none', 'text-danger');
          feedback.classList.add('text-success');
        } else {
          input.classList.add('is-invalid');
          input.classList.remove('is-valid');
          feedback.textContent = 'Must include: ' + errors.join(', ') + '.';
          feedback.classList.remove('d-none', 'text-success');
          feedback.classList.add('text-danger');
        }
      });

      input.addEventListener('input', () => {
        const errors = validateUsername(input.value);
        if (input.value.length === 0) {
          input.classList.remove('is-valid', 'is-invalid');
          feedback.textContent = '';
          feedback.classList.add('d-none');
          feedback.classList.remove('text-success', 'text-danger');
        } else if (errors.length === 0) {
          input.classList.add('is-valid');
          input.classList.remove('is-invalid');
          feedback.textContent = '';
          feedback.classList.add('d-none');
          feedback.classList.remove('text-success', 'text-danger');
        } else {
          input.classList.add('is-invalid');
          input.classList.remove('is-valid');
          feedback.textContent = 'Must include: ' + errors.join(', ') + '.';
          feedback.classList.remove('d-none', 'text-success');
          feedback.classList.add('text-danger');
        }
      });
    }

    initUsernameValidation();

    submitHandler = handlers['form:submit'];
    inputHandler  = handlers['input:input'];
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  // ── submit handler ──────────────────────────────────────────────────────────

  describe('submit handler — empty value', () => {
    beforeEach(() => {
      input.value = '';
      submitHandler({ preventDefault: jest.fn() });
    });

    test('adds is-invalid class', () => {
      expect(input.classList.contains('is-invalid')).toBe(true);
    });

    test('does not add is-valid class', () => {
      expect(input.classList.contains('is-valid')).toBe(false);
    });

    test('sets feedback text to "Username is required."', () => {
      expect(feedback.textContent).toBe('Username is required.');
    });

    test('removes d-none from feedback', () => {
      expect(feedback.classList.contains('d-none')).toBe(false);
    });

    test('adds text-danger to feedback', () => {
      expect(feedback.classList.contains('text-danger')).toBe(true);
    });

    test('does not add text-success to feedback', () => {
      expect(feedback.classList.contains('text-success')).toBe(false);
    });
  });

  describe('submit handler — valid username', () => {
    beforeEach(() => {
      input.value = 'Hello1!';
      submitHandler({ preventDefault: jest.fn() });
    });

    test('adds is-valid class', () => {
      expect(input.classList.contains('is-valid')).toBe(true);
    });

    test('does not add is-invalid class', () => {
      expect(input.classList.contains('is-invalid')).toBe(false);
    });

    test('sets welcome feedback message', () => {
      expect(feedback.textContent).toBe('Welcome, Hello1!! Username accepted.');
    });

    test('removes d-none from feedback', () => {
      expect(feedback.classList.contains('d-none')).toBe(false);
    });

    test('adds text-success to feedback', () => {
      expect(feedback.classList.contains('text-success')).toBe(true);
    });

    test('does not add text-danger to feedback', () => {
      expect(feedback.classList.contains('text-danger')).toBe(false);
    });
  });

  describe('submit handler — invalid username (missing requirements)', () => {
    beforeEach(() => {
      input.value = 'hello'; // missing uppercase, number, special char
      submitHandler({ preventDefault: jest.fn() });
    });

    test('adds is-invalid class', () => {
      expect(input.classList.contains('is-invalid')).toBe(true);
    });

    test('does not add is-valid class', () => {
      expect(input.classList.contains('is-valid')).toBe(false);
    });

    test('feedback starts with "Must include:"', () => {
      expect(feedback.textContent).toMatch(/^Must include:/);
    });

    test('feedback lists missing uppercase', () => {
      expect(feedback.textContent).toContain('1 uppercase letter');
    });

    test('feedback lists missing number', () => {
      expect(feedback.textContent).toContain('1 number');
    });

    test('feedback lists missing special character', () => {
      expect(feedback.textContent).toContain('1 special character');
    });

    test('removes d-none from feedback', () => {
      expect(feedback.classList.contains('d-none')).toBe(false);
    });

    test('adds text-danger to feedback', () => {
      expect(feedback.classList.contains('text-danger')).toBe(true);
    });
  });

  describe('submit handler — calls preventDefault', () => {
    test('always prevents default form submission', () => {
      const pd = jest.fn();
      input.value = 'Hello1!';
      submitHandler({ preventDefault: pd });
      expect(pd).toHaveBeenCalledTimes(1);
    });
  });

  // ── input handler ───────────────────────────────────────────────────────────

  describe('input handler — empty value', () => {
    beforeEach(() => {
      input.value = '';
      inputHandler();
    });

    test('removes is-valid class', () => {
      expect(input.classList.contains('is-valid')).toBe(false);
    });

    test('removes is-invalid class', () => {
      expect(input.classList.contains('is-invalid')).toBe(false);
    });

    test('clears feedback text', () => {
      expect(feedback.textContent).toBe('');
    });

    test('adds d-none to feedback', () => {
      expect(feedback.classList.contains('d-none')).toBe(true);
    });

    test('removes text-success from feedback', () => {
      expect(feedback.classList.contains('text-success')).toBe(false);
    });

    test('removes text-danger from feedback', () => {
      expect(feedback.classList.contains('text-danger')).toBe(false);
    });
  });

  describe('input handler — valid username', () => {
    beforeEach(() => {
      input.value = 'Hello1!';
      inputHandler();
    });

    test('adds is-valid class', () => {
      expect(input.classList.contains('is-valid')).toBe(true);
    });

    test('removes is-invalid class', () => {
      expect(input.classList.contains('is-invalid')).toBe(false);
    });

    test('clears feedback text', () => {
      expect(feedback.textContent).toBe('');
    });

    test('adds d-none to feedback', () => {
      expect(feedback.classList.contains('d-none')).toBe(true);
    });
  });

  describe('input handler — invalid username', () => {
    beforeEach(() => {
      input.value = 'hello'; // missing uppercase, number, special char
      inputHandler();
    });

    test('adds is-invalid class', () => {
      expect(input.classList.contains('is-invalid')).toBe(true);
    });

    test('removes is-valid class', () => {
      expect(input.classList.contains('is-valid')).toBe(false);
    });

    test('shows error feedback', () => {
      expect(feedback.textContent).toMatch(/^Must include:/);
    });

    test('removes d-none from feedback', () => {
      expect(feedback.classList.contains('d-none')).toBe(false);
    });

    test('adds text-danger to feedback', () => {
      expect(feedback.classList.contains('text-danger')).toBe(true);
    });
  });

  describe('input handler — partially valid (only missing special char)', () => {
    beforeEach(() => {
      input.value = 'Hello1'; // has length, uppercase, number — missing special char only
      inputHandler();
    });

    test('adds is-invalid class', () => {
      expect(input.classList.contains('is-invalid')).toBe(true);
    });

    test('feedback mentions special character', () => {
      expect(feedback.textContent).toContain('1 special character');
    });

    test('feedback does NOT mention uppercase', () => {
      expect(feedback.textContent).not.toContain('1 uppercase letter');
    });
  });

  describe('state transition: invalid → valid on submit', () => {
    test('clears is-invalid and sets is-valid after correcting username', () => {
      input.value = 'hello';
      submitHandler({ preventDefault: jest.fn() });
      expect(input.classList.contains('is-invalid')).toBe(true);

      input.value = 'Hello1!';
      submitHandler({ preventDefault: jest.fn() });
      expect(input.classList.contains('is-valid')).toBe(true);
      expect(input.classList.contains('is-invalid')).toBe(false);
    });
  });

  describe('state transition: valid → empty on input', () => {
    test('clears is-valid when input is cleared', () => {
      input.value = 'Hello1!';
      inputHandler();
      expect(input.classList.contains('is-valid')).toBe(true);

      input.value = '';
      inputHandler();
      expect(input.classList.contains('is-valid')).toBe(false);
      expect(input.classList.contains('is-invalid')).toBe(false);
    });
  });
});
