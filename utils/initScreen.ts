import { Dimensions } from "react-native";
export const screenHeight = Dimensions.get("window").height;
export const screenWidth = Dimensions.get("window").width;
export const screenRatio = screenHeight / screenWidth;

console.log("====================================");
console.log("screenHeight2", screenHeight);
console.log("screenWidth2", screenWidth);
console.log("screenHeight/screenWidth2", screenRatio);
console.log("====================================");
