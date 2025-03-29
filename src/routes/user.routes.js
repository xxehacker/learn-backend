import { Router } from "express";
import {
  loginUser,
  logOutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

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
router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyToken, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyToken, changeCurrentPassword);
router.route("/get-current-user").post(verifyToken, getCurrentUser);
router.route("/update-account-details").post(verifyToken, updateAccountDetails);

export default router;
