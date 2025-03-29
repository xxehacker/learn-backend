import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("user from generate token function",user)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false }); // to be remember

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /*
    1. get user details from frontend
    2. validation
    3. check if user already exists,
    4. check for images , check for avatar
    5. upload them to cloudinary 
    6. create user object - create entry in db
    7. remove password amd refresh token field from response
    8. check for user creation
    9. return response
  */

  try {
    const { username, email, fullName, password } = req.body;
    console.log(username, email, fullName, password);
    /*
      if i want to check one by one then
      if (fullName === "") {
        throw new ApiError(400, "Fullname is required");
      }
    */

    if (
      [username, email, fullName, password].some((field) => field.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email and username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log(avatarLocalPath, coverImageLocalPath);

    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      var coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // console.log("avatar and cover image:", { avatar, coverImage });

    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
      username: username.toLowerCase(),
      fullName,
      password,
      email,
      avatar: avatar.url,
      coverImage: coverImage?.url || "", // for safety
    });

    /*
    We can also do this way to check user creation
    if(!user){
        throw new ApiError(400, "User creation failed");
    }
    */

    // we can also check user creation this way and using select we remove the specific field from the user object.(Security purpose)
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  /* 
  1. Req body - username or email and password
  2. validatation - username or email
  3. find the user on db 
  4. password check
  5. access and refresh token
  6. send cookie
  */

  try {
    const { username, email, password } = req.body;
    // console.log(username, email, password);

    if (!username && !email) {
      throw new ApiError(400, "Username or Email is required");
    }

    if (!password) {
      throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
      $or: [{ username }, { email }],
    });
    // console.log("user: ", user);

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    // console.log("isPasswordValid",isPasswordValid);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    // console.log(accessToken, refreshToken);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    // console.log(loggedInUser);

    // send these to the user via cookie
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while logging in the system");
  }
});

const logOutUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user._id;
    await User.findByIdAndUpdate(
      user,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while logging out the user");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const userProvidedToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!userProvidedToken) {
      throw new ApiError(400, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      userProvidedToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ApiError(400, "Unauthorized request");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (userProvidedToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .clearCookie("accessToken", accessToken, options)
      .clearCookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while refreshing access token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    console.log(oldPassword, newPassword);

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "Old Password & New Password is Required");
    }

    const user = await User.findById(req.user?._id);
    // console.log("user", user);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    // console.log("isPasswordCorrect:", isPasswordCorrect);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while changing current password"
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
};
