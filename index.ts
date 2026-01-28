import express, { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserSignup, UserSignin, CourseSchema, updateCourse } from "./zod";
import { prisma } from './db'
const app = express();
app.use(express.json());

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}


interface UserPayload {
    id: string;
    role: string;
}

app.post("/auth/signup", async (req: Request, res: Response) => {
    try {
        let { success, data } = UserSignup.safeParse(req.body);
        console.log(req.body);
        if (!success || !data) {
            res.status(400).json({
                message: "invaild signup schema"
            })
            return;
        }
        console.log(req.body);
        let user = await prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                name: data?.name,
                role: data?.role
            }
        })
        console.log(req.body);
        res.status(201).json({
            message: "Signup successfull",
            id: user.id
        })
    } catch (e) {
        res.status(403).json({
            message: "user already exist"
        })
        return;
    }

})

app.post("/auth/signin", async (req, res) => {
    try {
        let { success, data } = UserSignin.safeParse(req.body);
        if (!success || !data) {
            res.status(400).json({
                message: "invaild signin schema"
            })
            return;
        }

        let user = await prisma.user.findFirst({
            where: {
                email: data?.email,
                password: data?.password
            }
        })
        if (!user) {
            res.status(403).json({
                message: "user doesnot exist"
            })
            return;
        }
        let token = jwt.sign({ id: user.id, role: user.role }, `${process.env.JWT_SECRE}`)
        console.log(`${process.env.JWT_SECRE}`)
        res.status(200).json({
            message: "login successfull",
            id: user.id,
            token

        })
    } catch (e) {
        res.status(403).json({
            message: "try Again !"
        })
        return;
    }

})

function middlewareAuth(req: Request, res: Response, next: NextFunction) {
    try {
        let token = req.headers.token! as string;""
        let decoded = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = decoded as UserPayload;
        next();

    } catch (e) {
        res.status(401).json({
            message: "Unauthrized"
        })
        return;
    }
}


app.post("/courses", middlewareAuth, async (req, res) => {
    try {
        if (req.user?.role != "INSTRUCTOR") {
            res.status(403).json({
                message: "Students has no access"
            })
            return;
        }
        let { success, data } = CourseSchema.safeParse(req.body);
        if (!success || !data) {
            res.status(400).json({
                message: "invaild signin schema"
            })
            return;
        }
        let couses = await prisma.course.create({
            data: {
                title: data.title,
                description: data?.description,
                price: data?.price,
                instructorId: req.user?.id
            }
        })

        res.status(201).json({
            message: "course created successfully",
            Courseid: couses.id
        })

    }
    catch (e) {
        res.status(500).json({
            message: "Try again later"
        })
        return;
    }
})

app.get("/courses", async (req, res) => {
    try {
        let couses = await prisma.course.findMany()

        res.status(201).json({
            Courses: couses
        })
        return;

    }
    catch (e) {
        res.status(500).json({
            message: "Try again later"
        })
        return;
    }
})


app.get("/courses/:id", middlewareAuth, async (req, res) => {
    try {
        if (!req.params.id) {
            res.status(403).json({
                message: "courseId needed"
            })
            return;
        }
        let couses = await prisma.course.findFirst({
            where: {
                id: (req.params.id as string)
            }
        })
        res.status(200).json({
            Courses: couses
        })
        return;

    }
    catch (e) {
        res.status(500).json({
            message: "Try again later"
        })
        return;
    }
})



app.patch("/courses/:id", middlewareAuth, async (req, res) => {
    try {
        if (req.user?.role != "INSTRUCTOR") {
            res.status(403).json({
                message: "Students has no access"
            })
            return;
        }
        let { success, data } = updateCourse.safeParse(req.body);
        if (!success || !data) {
            res.status(400).json({
                message: "invaild signin schema"
            })
            return;
        }

        let couses = await prisma.course.update({
            where: {
                instructorId: req.user.id,
                id: (req.params.id as string)
            },
            data: {
                title: data.title,
                description: data?.description,
                price: data?.price
            }
        })

        res.status(200).json({
            message: "course updated successfully",
            Courseid: couses.id
        })

    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Something went wrong. Please try again later."
        });
    }

})




app.delete("/courses/:id", middlewareAuth, async (req, res) => {
    try {
        if (req.user?.role != "INSTRUCTOR") {
            res.status(403).json({
                message: "Students has no access"
            })
            return;
        }
        let couses = await prisma.course.delete({
            where: {
                instructorId: req.user.id,
                id: (req.params.id as string)
            }
        })

        res.status(201).json({
            message: "course deleted successfully"
        })

    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Something went wrong. Please try again later."
        });
    }

})



app.post("/lessons", middlewareAuth, async (req, res) => {
    try {
        if (req.user?.role != "INSTRUCTOR") {
            res.status(403).json({
                message: "Students has no access"
            })
            return;
        }
        let { title, content, courseId } = req.body;
        let course = await prisma.course.findUnique({
            where: {
                id: courseId
            }
        })
        if (!course) {
            res.status(404).json({
                message: "course doesnot exist"
            })
            return;
        }
        if (course.instructorId != req.user.id) {
            res.status(403).json({
                message: "This course doesnot belongs to you"
            })
            return;
        }
        let lessons = await prisma.lesson.create({
            data: {
                title,
                content,
                courseId
            }
        })
        res.status(201).json({
            lessons
        })
        return;

    }
    catch (e) {

    }
})



app.get("/courses/:courseId/lessons", async (req, res) => {
    try {
        let course = await prisma.course.findUnique({
            where: {
                id: req.params.courseId
            }
        })
        if (!course) {
            res.status(404).json({
                message: "course doesnot exist"
            })
            return;
        }
        let lessons = await prisma.lesson.findMany({
            where: {
                courseId: req.params.courseId as string
            }
        })
        res.status(200).json({
            lessons
        })
        return;
    }
    catch (e) {

    }
})

app.post("/purchases", middlewareAuth, async (req, res) => {
    try {
        if (req.user?.role == "INSTRUCTOR") {
            res.status(403).json({
                message: "No access"
            })
            return;
        }
        let { courseId } = req.body;
        let purchases = await prisma.purchase.create({
            data: {
                courseId: courseId as string,
                userId: req.user?.id as string
            }
        })
        res.status(201).json({
            purchases
        })
        return;

    }
    catch (e) {

    }
})


app.get("/users/:id/purchases", middlewareAuth, async (req, res) => {
    try {
        let purchases = await prisma.purchase.findMany({
            where: {
                userId: req.user?.id as string
            }
        })
        res.status(200).json({
            purchases
        })
        return;
    }
    catch (e) {

    }
})
app.listen(3000, () => {
    console.log("running");
})