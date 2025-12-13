export function executeGetObjectLinkedToAttribute(searchText: string) {
    let openBraceCount = 0;
    // Traverse backwards through the text before the position
    for (let i = searchText.length - 1; i >= 0; i--) {
        const char = searchText[i];

        if (char === '}' || char === ']') {
            openBraceCount++;
        } else if (char === '{' || char === '[') {
            openBraceCount--;
            // If the brace count becomes negative, we've found an unbalanced opening '{'
            if (openBraceCount < 0) {
                // Get the text before the '{' which should be the object
                const textBeforeBrace = searchText.substring(0, i).trim();
                // Use a regex to find the object name before the '{'
                const objectMatch = textBeforeBrace.match(/(?<=[ =])([@~]|(\?~?!?))?[\w:\-_]+$/); // Match the last word before the brace
                if (objectMatch && objectMatch[0]) {
                    return objectMatch[0]; // Return the object name
                }

                return null; // No object found before '{'
            }
        }
    }

    return null; // No unbalanced opening brace found
}

// export function executeGetObjectLinkedToAttribute(searchText: string) {
//     let curlyBraceCount = 0;
//     let squareBraceCount = 0;
//     // Traverse backwards through the text before the position
//     for (let i = searchText.length - 1; i >= 0; i--) {
//         const char = searchText[i];

//         switch (char) {
//             case '}':
//                 curlyBraceCount++;
//                 break;
//             case '{':
//                 curlyBraceCount--;
//                 break;
//             case ']':
//                 squareBraceCount++;
//                 break;
//             case '[':
//                 squareBraceCount--;
//                 break;
//         }

//         if (curlyBraceCount < 0 || squareBraceCount < 0) {
//             // Get the text before the '{' which should be the object
//             const textBeforeBrace = searchText.substring(0, i).trim();
//             // Use a regex to find the object name before the '{'
//             const objectMatch = textBeforeBrace.match(/(?<=[ =])([@~]|(\?~?!?))?[\w:\-_]+$/); // Match the last word before the brace
//             if (objectMatch && objectMatch[0]) {
//                 return objectMatch[0]; // Return the object name
//             }

//             return null; // No object found before '{'
//         }
//     }

//     return null; // No unbalanced opening brace found
// }
