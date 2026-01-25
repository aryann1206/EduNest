import * as z from "zod";


const UserSignup = z.object({
    email: z.email(),
    password: z.string().min(6),
    name: z.string(),
    role: z.enum(["STUDENT", "INSTRUCTOR"])
});


const UserSignin = z.object({
    email: z.email(),
    password: z.string().min(6)
    
});

const CourseSchema=z.object({
    title      :  z.string(),
    description : z.string().optional(),
    price     :   z.number()
})


const updateCourse =z.object({
    title      :  z.string().optional(),
    description : z.string().optional(),
    price     :   z.number().optional()
})
export{
    UserSignup,UserSignin,CourseSchema,updateCourse
}