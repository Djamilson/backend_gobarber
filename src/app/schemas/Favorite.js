import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema(
  {
    user: {
      type: Number,
      required: true,
    },
    company: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Favorite', FavoriteSchema);
