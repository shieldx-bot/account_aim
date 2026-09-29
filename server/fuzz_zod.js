const { z } = require('zod');
const schema = z.object({ name: z.string().min(2) });
const result = schema.safeParse({ name: "a" });
console.log(result.error.errors);
console.log(result.error.issues);
