const fs = require("fs");
const path = require("path");

// Console log patterns to replace
const patterns = [
  {
    find: /console\.log\(`📁/g,
    replace: "logger.file(`",
  },
  {
    find: /console\.log\(`📊/g,
    replace: "logger.storage(`",
  },
  {
    find: /console\.log\(`🔄/g,
    replace: "logger.loading(`",
  },
  {
    find: /console\.log\(`✅/g,
    replace: "logger.success(`",
  },
  {
    find: /console\.log\(`🔍/g,
    replace: "logger.debug(`",
  },
  {
    find: /console\.log\(`🚀/g,
    replace: "logger.action(`",
  },
  {
    find: /console\.log\("📁/g,
    replace: 'logger.file("',
  },
  {
    find: /console\.log\("📊/g,
    replace: 'logger.storage("',
  },
  {
    find: /console\.log\("🔄/g,
    replace: 'logger.loading("',
  },
  {
    find: /console\.log\("✅/g,
    replace: 'logger.success("',
  },
  {
    find: /console\.log\("🔍/g,
    replace: 'logger.debug("',
  },
  {
    find: /console\.log\("🚀/g,
    replace: 'logger.action("',
  },
];

// Add logger import if not present
const addLoggerImport = (content) => {
  if (!content.includes("import { logger }")) {
    // Find the last import statement
    const importRegex = /import.*from.*["']@\/lib\/hooks\/useStripe["'];?/;
    const match = content.match(importRegex);

    if (match) {
      return content.replace(
        match[0],
        `${match[0]}\nimport { logger } from "@/lib/utils/logger";`
      );
    }
  }
  return content;
};

// Process a single file
const processFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Add logger import if needed
    const contentWithImport = addLoggerImport(content);
    if (contentWithImport !== content) {
      content = contentWithImport;
      modified = true;
    }

    // Replace console.log patterns
    patterns.forEach((pattern) => {
      if (pattern.find.test(content)) {
        content = content.replace(pattern.find, pattern.replace);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
};

// Find all TypeScript/JavaScript files
const findFiles = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith(".") &&
      item !== "node_modules"
    ) {
      files.push(...findFiles(fullPath));
    } else if (
      item.endsWith(".tsx") ||
      item.endsWith(".ts") ||
      item.endsWith(".js")
    ) {
      files.push(fullPath);
    }
  });

  return files;
};

// Main execution
console.log("🔧 Console Log Cleanup Script");
console.log("============================");

const projectRoot = process.cwd();
const files = findFiles(projectRoot);

console.log(`📁 Found ${files.length} files to process`);

files.forEach((file) => {
  processFile(file);
});

console.log("\n✅ Console log cleanup completed!");
console.log("\n📝 Next steps:");
console.log("1. Review the changes in your files");
console.log("2. Test the application to ensure logs work correctly");
console.log("3. Add NEXT_PUBLIC_DEBUG_MODE=true to .env.local for debug logs");
console.log("4. In production, logs will be automatically disabled");
