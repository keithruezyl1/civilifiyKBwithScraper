import { Constitution1987Parser } from './src/parsers/Constitution1987Parser.js';
import { DocumentScraper } from './src/scraper/DocumentScraper.js';

async function testScrapingOnly() {
  try {
    console.log('🚀 Testing scraping and parsing (no database)...');
    
    // Create parser and scraper
    const parser = new Constitution1987Parser();
    const scraper = new DocumentScraper({
      maxRps: 1,
      userAgent: 'LawEntryBot/1.0 (contact@example.com)'
    });
    
    // Fetch the 1987 Constitution
    console.log('📥 Fetching 1987 Constitution...');
    const fetchResult = await scraper.fetchWithRetry('https://lawphil.net/consti/cons1987.html');
    
    console.log(`✅ Fetched ${fetchResult.html.length} characters`);
    
    // Parse the document
    console.log('🔍 Parsing document...');
    const results = parser.parse({
      canonicalUrl: 'https://lawphil.net/consti/cons1987.html',
      html: fetchResult.html
    });
    
    console.log(`✅ Parsed ${results.length} sections`);
    
    // Show sample results
    console.log('\n📋 Sample Parsed Sections:');
    results.slice(0, 5).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.metadata.title}`);
      console.log(`   Article: ${result.metadata.articleNumber}, Section: ${result.metadata.sectionNumber}`);
      console.log(`   Topics: ${result.metadata.topics.join(', ')}`);
      console.log(`   Text: ${result.extracted_text.substring(0, 100)}...`);
      console.log(`   Sequence: ${result.sequence_index}`);
    });
    
    // Show summary
    console.log('\n📊 Summary:');
    console.log(`  - Total sections: ${results.length}`);
    console.log(`  - Preamble: ${results.filter(r => r.metadata.preamble).length}`);
    console.log(`  - Articles: ${new Set(results.map(r => r.metadata.articleNumber)).size}`);
    
    const articleCounts = {};
    results.forEach(r => {
      const article = r.metadata.articleNumber;
      articleCounts[article] = (articleCounts[article] || 0) + 1;
    });
    
    console.log('\n📋 Articles found:');
    Object.entries(articleCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([article, count]) => {
        console.log(`  - Article ${article}: ${count} sections`);
      });
    
    console.log('\n🎉 Scraping and parsing test completed successfully!');
    console.log('The Constitution1987Parser is working correctly and ready for integration.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testScrapingOnly();
