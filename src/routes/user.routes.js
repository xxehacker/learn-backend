import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

/*
Short syntax:- router.post('/register',registerUser)
With arrow function as callback:- router.get("/healcheck", (req, res, next) => {
  return res.json({
    message: "Good",
  });
});
*/

router.route("/register").post(registerUser);

export default router;
