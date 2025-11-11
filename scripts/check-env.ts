import "dotenv/config";

const hasKey = Boolean(process.env.MOONBASE_PRIVATE_KEY);

console.log(`MOONBASE_PRIVATE_KEY present: ${hasKey}`);


