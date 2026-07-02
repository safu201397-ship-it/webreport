const fs = require('fs');

function extractData() {
    try {
        const academicsHTML = fs.readFileSync('C:/Users/safu/.gemini/antigravity/brain/579adee4-ef16-460d-8063-b6e3241a1247/.system_generated/steps/61/content.md', 'utf8');
        const adminHTML = fs.readFileSync('C:/Users/safu/.gemini/antigravity/brain/579adee4-ef16-460d-8063-b6e3241a1247/.system_generated/steps/62/content.md', 'utf8');

        // Extract Academics
        // Nuxt data is often in window.__NUXT__ or we can parse HTML tags.
        // Let's use simple regex to find the names.
        
        // For academics: Look for "group-title" to get College, and then the text inside.
        // It's probably easier to extract JSON from <script>window.__NUXT__=(function(a,b...
        const nuxtRegex = /window\.__NUXT__=\(function\([^)]*\)\{return\s*(.*?)\}\(/;
        
        const acadMatch = academicsHTML.match(nuxtRegex);
        let acadData = {};
        if (acadMatch) {
            // It's an eval string basically. Let's just try basic regex on the HTML body.
        }

        // Simpler regex for HTML: 
        // <div class="group"><div class="group-title">...<a class="link"...>智慧科技學院</a>...</div>
        // <div class="info">...<span>資訊工程學系</span>...</div>
        
        let colleges = {};
        let currentCollege = null;

        const acadParts = academicsHTML.split(/<div class="group-title"|<div class="info"/);
        for (let i = 1; i < acadParts.length; i++) {
            const part = acadParts[i];
            // If it's a college
            if (part.includes('class="link"')) {
                const titleMatch = part.match(/>([^<]+)<\/a>/);
                if (titleMatch) {
                    currentCollege = titleMatch[1].trim();
                    if (!colleges[currentCollege]) {
                        colleges[currentCollege] = [];
                    }
                }
            } else if (part.includes('<span') || part.includes('<a')) {
                // It's an info block
                let nameMatch = part.match(/<span[^>]*>([^<]+)<\/span>/);
                if (!nameMatch) {
                    nameMatch = part.match(/>([^<]+)<\/a>/);
                }
                
                if (nameMatch && currentCollege) {
                    const deptName = nameMatch[1].trim();
                    if (deptName && !colleges[currentCollege].includes(deptName)) {
                        colleges[currentCollege].push(deptName);
                    }
                }
            }
        }

        // Administrative Units extraction
        // Usually in a list or similar structure on the page.
        // Let's look for `class="title"` or `class="name"` or `link`
        // We'll just extract all unique texts from links in the content area.
        let admins = [];
        // The admin page has a post content. We can split by <a and get text.
        // Or look for specific repeating patterns. Let's look for `<div class="info">` or `<h4>` or `<a`
        // Let's just grab all texts inside <strong> or <a> that might be units.
        // Let's try to find text like "校長室", "秘書處", etc.
        const adminBodyMatch = adminHTML.split(/<div[^>]*post-content[^>]*>/);
        if (adminBodyMatch.length > 1) {
            const adminContent = adminBodyMatch[1];
            const aTags = adminContent.match(/<a[^>]*>([^<]+)<\/a>/g);
            if (aTags) {
                aTags.forEach(tag => {
                    const textMatch = tag.match(/>([^<]+)<\/a>/);
                    if (textMatch) {
                        const t = textMatch[1].trim();
                        if (t && t.length > 1 && !admins.includes(t)) {
                            admins.push(t);
                        }
                    }
                });
            }
            
            // sometimes they are in spans or plain text
            const spanTags = adminContent.match(/<span[^>]*>([^<]+)<\/span>/g);
            if(spanTags){
               spanTags.forEach(tag => {
                    const textMatch = tag.match(/>([^<]+)<\/span>/);
                    if (textMatch) {
                        const t = textMatch[1].trim();
                        if (t && t.length > 1 && t.length < 20 && !admins.includes(t)) {
                            admins.push(t);
                        }
                    }
                });
            }
        }

        const result = {
            academic: colleges,
            administrative: admins
        };

        fs.writeFileSync('C:/Users/safu/Desktop/網頁人才培訓/extracted_data.json', JSON.stringify(result, null, 2));
        console.log('Extraction complete.');

    } catch (e) {
        console.error('Error:', e);
    }
}

extractData();
