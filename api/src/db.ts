import mongoose from "mongoose";

export function connect(uri: string) {
  return mongoose.connect(uri);
}
