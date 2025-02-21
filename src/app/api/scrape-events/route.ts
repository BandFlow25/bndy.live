// src/app/api/scrape-events/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { parseDate } from '@/lib/utils/date-utils';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // Fetch the webpage content
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const events: any[] = [];

    // Each gig is in a table cell with class 'date-cell'
    $('.date-cell').each((_, element) => {
      const $cell = $(element);
      
      // Extract date - usually in a data attribute or specific format
      const dateText = $cell.find('.date').text().trim();
      const date = parseDate(dateText); // You'll need to implement this based on the site's format
      
      // Extract artist info
      const $artist = $cell.find('.artist-info');
      const artistName = $artist.find('.name').text().trim();
      const artistFacebookUrl = $artist.find('.facebook-link').attr('href');
      const artistInstagramUrl = $artist.find('.instagram-link').attr('href');
      
      // Extract venue info
      const $venue = $cell.find('.venue-info');
      const venueName = $venue.find('.name').text().trim();
      const venueFacebookUrl = $venue.find('.facebook-link').attr('href');
      const venueWebsite = $venue.find('.website-link').attr('href');
      
      // Extract ticket info
      const ticketUrl = $cell.find('.ticket-link').attr('href');
      const ticketPrice = $cell.find('.price').text().trim();
      
      events.push({
        artist: {
          name: artistName,
          facebookUrl: artistFacebookUrl,
          instagramUrl: artistInstagramUrl
        },
        venue: {
          name: venueName,
          facebookUrl: venueFacebookUrl,
          websiteUrl: venueWebsite
        },
        date,
        ticketUrl,
        ticketPrice
      });
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error scraping events:', error);
    return NextResponse.json(
      { error: 'Failed to scrape events' },
      { status: 500 }
    );
  }
}