import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    9. retturn response
  */

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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // console.log(avatarLocalPath, coverImageLocalPath);

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

  //   we can also check user creation this way and using select we remove the specific field from the user object.(Security purpose)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export { registerUser };
