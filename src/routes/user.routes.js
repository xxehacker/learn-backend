import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

/*
Short syntax:- router.post('/register',upload ,registerUser)
With arrow function as callback:- router.get("/healcheck", (req, res, next) => {
  return res.json({
    message: "Good",
  });
});
*/

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

export default router;
