const { validationResult } = require('express-validator');

// validationResult: extracts the validation errors from a request and makes them available in a Result object.
const validateInput = ( req, res, next ) => { 
    const errors = validationResult(req);
    if( !errors.isEmpty() ){
        const { msg }  = errors.errors[0];
        return res.status(400).json({msg:msg});
    }

    next();
}

module.exports = {
    validateInput
}
