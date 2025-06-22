import { test } from '@playwright/test';

test.setTimeout(35e3);

test('video summary smoke test', async ({ page }) => {
  // give the url
  await page.goto('/');

  // Fill the YouTube URL into an input box
  await page.fill('input[type="text"]', 'https://www.youtube.com/watch?v=3JW732GrMdg');

  // Click the button with the BsStars icon to fetch transcript
  await page.click('button.bg-green-600');

  // should see the loading of fetch (Fetching video information...)
  await page.waitForSelector('text=Fetching video information...', { state: 'visible' });
  await page.waitForSelector('text=Fetching video information...', { state: 'hidden' });

  // Click the "Generate Summary" button
  await page.click('button:has-text("Generate Summary")');

  // should see the loading of summary generation
  await page.waitForSelector('button:has-text("Generating Summary...")', { state: 'visible' });
  await page.waitForSelector('button:has-text("Generating Summary...")', { state: 'hidden' });

  // should see the summary
  await page.waitForSelector('div.whitespace-pre-wrap', { state: 'visible' });

  // should click on the audio (Get Audio Version button)
  await page.click('button:has-text("Get Audio Version")');

  // should get a loading (audio generation spinner)
  await page.waitForSelector('button:has-text("Get Audio Version") svg.animate-spin', { state: 'visible' });
  await page.waitForSelector('button:has-text("Get Audio Version") svg.animate-spin', { state: 'hidden' });

  // then get a new audio section (audio bar did appear)
  await page.waitForSelector('div.bg-gray-800.p-4.rounded-xl', { state: 'visible' });

  // try to download using the download button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('a[download]'), // Using the download attribute for the anchor tag
  ]);
  // Verify download is initiated (optional: save and check file)
  console.log(`Download path: ${await download.path()}`);
});
