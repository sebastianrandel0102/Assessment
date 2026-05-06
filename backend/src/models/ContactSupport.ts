import mongoose, { Schema, type Document } from 'mongoose';

const CONTACT_SUPPORT_COLLECTION = '_mail';

export interface ContactSupportDocument extends Document {
  name: string;
  email: string;
  message: string;
  emailLayoutHtml: string;
  emailVerifiedAt?: Date;
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
    emailLayoutHtml: {
      type: String,
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
    },
  },
  {
    collection: CONTACT_SUPPORT_COLLECTION,
    timestamps: true,
  }
);

const ContactSupport = mongoose.model<ContactSupportDocument>(
  'ContactSupport',
  contactSupportSchema
);

export default ContactSupport;
