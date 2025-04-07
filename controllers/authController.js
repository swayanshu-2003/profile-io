const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { generateToken } = require("../utils/jwt");
const { z } = require("zod");

const prisma = new PrismaClient();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const signup = async (req, res) => {
  console.log(req.body);
  try {
    const validatedData = signupSchema.parse(req.body);
    const { email, password } = validatedData;
    console.log(validatedData);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(user.id);
    res.status(201).json({ token, userId: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const signin = async (req, res) => {
  try {
    const validatedData = signinSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    res.json({ token, userId: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { signup, signin };
