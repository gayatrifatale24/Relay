import { Schema, model, type InferSchemaType } from "mongoose";

// createdAt is a plain field (not schema timestamps) so streamed replies can be saved with the
// ids and times already sent to the client.
const messageSchema = new Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

conversationSchema.index({ user: 1, updatedAt: -1 });

export type ConversationDoc = InferSchemaType<typeof conversationSchema>;

export const Conversation = model("Conversation", conversationSchema);
