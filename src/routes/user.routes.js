import { Router } from "express";
import {
  loginUser,
  logOutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
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
router.route("/get-current-user").get(verifyToken, getCurrentUser);
router.route("/update-account-details").patch(verifyToken, updateAccountDetails);

// Image Route
router.route("/update-avatar").patch(verifyToken,upload.single("avatar"), updateUserAvatar);
router.route("/update-cover").patch(verifyToken,upload.single("coverImage"), updateUserCoverImage);

router.route('/c/:username').get(verifyToken,getUserChannelProfile)

export default router;
