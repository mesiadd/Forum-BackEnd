const router = require("express").Router();

// Import the functions from the reset.controller module
const { requestPasswordReset, resetPassword } = require("./reset.controller");

// Define routes and associate them with the imported functions
router.post("/", requestPasswordReset); // POST / route
router.post("/pass", resetPassword); // POST /pass route

module.exports = router;
