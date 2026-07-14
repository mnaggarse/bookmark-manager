export interface WebpageMetadata {
  title: string;
  description: string;
  imageUrl: string | null;
  siteName: string;
  readTimeEstimate: number; // in minutes
}

export async function fetchWebpageMetadata(
  targetUrl: string,
): Promise<WebpageMetadata> {
  // Normalize URL
  let url = targetUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    hostname = targetUrl;
  }

  const defaultMetadata: WebpageMetadata = {
    title: hostname,
    description: "",
    imageUrl: null,
    siteName: hostname,
    readTimeEstimate: 1,
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
      signal: AbortSignal.timeout(8000), // 8 seconds timeout
    });

    if (!response.ok) {
      return defaultMetadata;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return defaultMetadata;
    }

    const html = await response.text();

    // Extract Title
    let title = "";
    const ogTitleMatch =
      html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
      );
    const twitterTitleMatch =
      html.match(
        /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i,
      );
    const standardTitleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    if (ogTitleMatch) {
      title = decodeHtmlEntities(ogTitleMatch[1]);
    } else if (twitterTitleMatch) {
      title = decodeHtmlEntities(twitterTitleMatch[1]);
    } else if (standardTitleMatch) {
      title = decodeHtmlEntities(standardTitleMatch[1]);
    } else {
      title = hostname;
    }

    // Extract Description
    let description = "";
    const ogDescMatch =
      html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
      );
    const stdDescMatch =
      html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
      );
    const twitterDescMatch =
      html.match(
        /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i,
      );

    if (ogDescMatch) {
      description = decodeHtmlEntities(ogDescMatch[1]);
    } else if (stdDescMatch) {
      description = decodeHtmlEntities(stdDescMatch[1]);
    } else if (twitterDescMatch) {
      description = decodeHtmlEntities(twitterDescMatch[1]);
    }

    // Extract Image
    let imageUrl: string | null = null;
    const ogImageMatch =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      );
    const twitterImageMatch =
      html.match(
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
      );

    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
    } else if (twitterImageMatch) {
      imageUrl = twitterImageMatch[1];
    }

    // Resolve relative image URLs
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      try {
        const base = new URL(url);
        imageUrl = new URL(imageUrl, base.origin).toString();
      } catch (e) {
        // Keep original if parsing fails
      }
    }

    // Extract Site Name
    let siteName = hostname;
    const ogSiteNameMatch =
      html.match(
        /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i,
      );
    if (ogSiteNameMatch) {
      siteName = decodeHtmlEntities(ogSiteNameMatch[1]);
    } else {
      // Clean up site name (e.g. remove www.)
      siteName = hostname.replace(/^www\./i, "");
    }

    // Estimate reading time from HTML body
    let readTimeEstimate = 1;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyText = bodyMatch[1]
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const wordCount = bodyText
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      readTimeEstimate = Math.max(1, Math.round(wordCount / 200));
    }

    return {
      title: title.trim() || hostname,
      description: description.trim(),
      imageUrl: imageUrl ? imageUrl.trim() : null,
      siteName: siteName.trim(),
      readTimeEstimate,
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return defaultMetadata;
  }
}

// Simple HTML entity decoder
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ");
}
