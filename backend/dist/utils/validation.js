"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPackSchema = exports.playRoundSchema = exports.startBattleSchema = exports.loginSchema = exports.registerSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
const errors_1 = require("./errors");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password is too long'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.startBattleSchema = zod_1.z.object({
    squadCardIds: zod_1.z.array(zod_1.z.string()).min(5, 'You need exactly 5 cards').max(5, 'You can only select 5 cards'),
});
exports.playRoundSchema = zod_1.z.object({
    playerCardId: zod_1.z.string().min(1, 'Player card ID is required'),
});
exports.openPackSchema = zod_1.z.object({
    packType: zod_1.z.enum(['basic', 'premium', 'legendary'], {
        errorMap: () => ({ message: 'Pack type must be basic, premium, or legendary' }),
    }),
});
function validate(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new errors_1.BadRequestError(message);
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validation.js.map