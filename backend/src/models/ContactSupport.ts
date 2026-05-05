import mongoose, { Schema, type Document } from 'mongoose';

export interface ContactSupportDocument extends Document {
  name: string;
  email: string;
  message: string;
}

const contactSupportSchema = new Schema<ContactSupportDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ContactSupport = mongoose.model<ContactSupportDocument>(
  'ContactSupport',
  contactSupportSchema,
  '_mail' 
);

export default ContactSupport;
