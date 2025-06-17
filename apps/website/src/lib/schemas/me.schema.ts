import z from "zod";


export const meRequestBodySchema = z.object({
    name: z.string()
        .trim()
        // 50 characters for a name seemed reasonable
        .max(50, 'Name must be under 50 characters')
        .regex(/^[\p{L}\s\-'.]+$/u, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
        .optional(),
    referredById: z.string()
        .trim()
        .optional(),
}).optional();