import mongoose from "mongoose";

const shopSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    image: {
        type: String,
        default: "",
    },

    images: {
        type: [String],
        default: []
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    city:{
         type:String,
        required:true
    },
    state:{
         type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    location: {
    type: {
        type: String,
        enum: ["Point"],
        default: "Point",
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
    },
},

    isOpen: {
        type: Boolean,
        default: true,
    },

    items:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Item"
    }]

},{timestamps:true})
shopSchema.index({ location: "2dsphere" });


const Shop=mongoose.model("Shop",shopSchema)

export default Shop
