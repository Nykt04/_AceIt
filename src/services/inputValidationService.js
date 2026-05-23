/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Simple but effective email validation
  // Checks for: characters before @, @ symbol, characters after @, at least one dot, and at least 2 chars after final dot
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { valid: true };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password too long (max 128 characters)');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter (a-z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('At least one number (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&*...)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize text input to prevent injection attacks
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum length allowed (default 255)
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"']/g, '') // Remove HTML/XML tags and quotes
    .replace(/[;`]/g, ''); // Remove SQL injection characters
};

/**
 * Validate study set title
 * @param {string} title - Title to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export const validateStudySetTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  const sanitized = sanitizeInput(title, 100);

  if (sanitized.length === 0) {
    return { valid: false, error: 'Title contains invalid characters' };
  }

  if (sanitized.length > 100) {
    return { valid: false, error: 'Title is too long (max 100 characters)' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate study set description
 * @param {string} description - Description to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export const validateStudySetDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return { valid: true, sanitized: '' }; // Description is optional
  }

  const sanitized = sanitizeInput(description, 500);

  if (sanitized.length > 500) {
    return { valid: false, error: 'Description is too long (max 500 characters)' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate flashcard term/question
 * @param {string} term - Term to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export const validateTerm = (term) => {
  if (!term || term.trim().length === 0) {
    return { valid: false, error: 'Term cannot be empty' };
  }

  const sanitized = sanitizeInput(term, 200);

  if (sanitized.length === 0) {
    return { valid: false, error: 'Term contains invalid characters' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate flashcard definition/answer
 * @param {string} definition - Definition to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export const validateDefinition = (definition) => {
  if (!definition || definition.trim().length === 0) {
    return { valid: false, error: 'Definition cannot be empty' };
  }

  const sanitized = sanitizeInput(definition, 1000);

  if (sanitized.length === 0) {
    return { valid: false, error: 'Definition contains invalid characters' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate full name
 * @param {string} fullName - Full name to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length === 0) {
    return { valid: false, error: 'Full name is required' };
  }

  const sanitized = sanitizeInput(fullName, 100);

  if (sanitized.length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters' };
  }

  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { valid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { valid: true, sanitized };
};

/**
 * Validate all flashcard data before saving
 * @param {{term: string, definition: string}} flashcard - Flashcard data
 * @returns {{valid: boolean, errors: {term?: string, definition?: string}}}
 */
export const validateFlashcard = (flashcard) => {
  const errors = {};

  const termValidation = validateTerm(flashcard.term);
  if (!termValidation.valid) {
    errors.term = termValidation.error;
  }

  const defValidation = validateDefinition(flashcard.definition);
  if (!defValidation.valid) {
    errors.definition = defValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
