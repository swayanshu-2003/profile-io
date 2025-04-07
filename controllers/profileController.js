const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");

const prisma = new PrismaClient();

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  summary: z.string().optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  experiences: z
    .array(
      z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        url: z.string().optional(),
      })
    )
    .optional(),
  skills: z
    .array(
      z.object({
        name: z.string(),
        proficiency: z.number().min(1).max(5),
      })
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        issueDate: z.string(),
        expiryDate: z.string().optional(),
      })
    )
    .optional(),
});

const createOrUpdateProfile = async (req, res) => {
  try {
    const validatedData = profileSchema.parse(req.body);
    const profile = await prisma.profile.upsert({
      where: { userId: req.userId },
      update: {
        ...validatedData,
        education: { deleteMany: {}, create: validatedData.education || [] },
        experiences: {
          deleteMany: {},
          create: validatedData.experiences || [],
        },
        projects: { deleteMany: {}, create: validatedData.projects || [] },
        skills: { deleteMany: {}, create: validatedData.skills || [] },
        certifications: {
          deleteMany: {},
          create: validatedData.certifications || [],
        },
      },
      create: {
        userId: req.userId,
        ...validatedData,
        education: { create: validatedData.education || [] },
        experiences: { create: validatedData.experiences || [] },
        projects: { create: validatedData.projects || [] },
        skills: { create: validatedData.skills || [] },
        certifications: { create: validatedData.certifications || [] },
      },
      include: {
        education: true,
        experiences: true,
        projects: true,
        skills: true,
        certifications: true,
      },
    });

    res.json({
      profile,
      profileLink: `http://localhost:5000/profile/${profile.id}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const listProfiles = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        summary: true,
        phone: true,
        linkedin: true,
        skills: {
          take: 2, // Limit to 2 skills
          select: {
            name: true,
            proficiency: true,
          },
        },
        experiences: {
          take: 1, // Limit to 2 experiences
          select: {
            company: true,
            position: true,
          },
        },
      },
    });

    res.json({ profiles });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.params.id },
      include: {
        education: true,
        experiences: true,
        projects: true,
        skills: true,
        certifications: true,
        user: { select: { email: true } },
      },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const getMyProfile = async (req, res) => {
  console.log(req?.userId);
  try {
    const profile = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      include: {
        profile: {
          include: {
            education: true,
            experiences: true,
            projects: true,
            skills: true,
            certifications: true,
            // Removed redundant `user` include
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found", userId:req?.userId });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createOrUpdateProfile,
  listProfiles,
  getProfile,
  getMyProfile,
};
