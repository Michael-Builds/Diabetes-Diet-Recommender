import mongoose, { Model, Schema } from "mongoose";
import { INotification } from "../interfaces/notication.interface";


const notificationSchema = new Schema<INotification>({
    userId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "unread",
        enum: ['read', 'unread'],
    },
}, { timestamps: true })

const notificatioModel: Model<INotification> = mongoose.model("Notification", notificationSchema);

export default notificatioModel