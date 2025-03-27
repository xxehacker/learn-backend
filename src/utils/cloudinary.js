import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    // upload file on cloudinary
    const response = await cloudinary.v2.upload(localfilepath, {
      resource_type: "auto",
    });

    console.log(
      "File has been Successufully uploaded on cloudinary",
      response.url
    );
    return response;
  } catch (error) {
    fs.unlinkSync(localfilepath); // remove the locally saved temp file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
