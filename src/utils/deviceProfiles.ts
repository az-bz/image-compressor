interface DeviceProfile {
  Make: string;
  Model: string;
  Software: string;
  FNumber: number;
  FocalLength: number;
  LensModel: string;
}

const iphoneProfiles: DeviceProfile[] = [
  {
    Make: 'Apple',
    Model: 'iPhone 13',
    Software: '15.7',
    FNumber: 1.6,
    FocalLength: 26,
    LensModel: 'iPhone 13 back dual wide camera 5.1mm f/1.6',
  },
  {
    Make: 'Apple',
    Model: 'iPhone 13 Pro',
    Software: '16.5',
    FNumber: 1.5,
    FocalLength: 24,
    LensModel: 'iPhone 13 Pro back triple camera 5.7mm f/1.5',
  },
  {
    Make: 'Apple',
    Model: 'iPhone 14',
    Software: '16.5',
    FNumber: 1.5,
    FocalLength: 26,
    LensModel: 'iPhone 14 back dual wide camera 5.7mm f/1.5',
  },
  {
    Make: 'Apple',
    Model: 'iPhone 14 Pro',
    Software: '17.2',
    FNumber: 1.78,
    FocalLength: 24,
    LensModel: 'iPhone 14 Pro back triple camera 6.86mm f/1.78',
  },
  {
    Make: 'Apple',
    Model: 'iPhone 15',
    Software: '17.4',
    FNumber: 1.6,
    FocalLength: 26,
    LensModel: 'iPhone 15 back dual wide camera 5.7mm f/1.6',
  },
  {
    Make: 'Apple',
    Model: 'iPhone 15 Pro',
    Software: '17.4',
    FNumber: 1.78,
    FocalLength: 24,
    LensModel: 'iPhone 15 Pro back triple camera 6.765mm f/1.78',
  },
];

const androidProfiles: DeviceProfile[] = [
  {
    Make: 'Samsung',
    Model: 'SM-S911B',
    Software: 'S911BXXU2BWL1',
    FNumber: 2.4,
    FocalLength: 23,
    LensModel: 'Samsung Galaxy S23 Main Camera 6.4mm f/2.4',
  },
  {
    Make: 'Samsung',
    Model: 'SM-S918B',
    Software: 'S918BXXU2BWL1',
    FNumber: 1.7,
    FocalLength: 23,
    LensModel: 'Samsung Galaxy S23 Ultra Main Camera 5.7mm f/1.7',
  },
  {
    Make: 'Samsung',
    Model: 'SM-S921B',
    Software: 'S921BXXU1AWF5',
    FNumber: 2.2,
    FocalLength: 23,
    LensModel: 'Samsung Galaxy S24 Main Camera 6.2mm f/2.2',
  },
  {
    Make: 'Samsung',
    Model: 'SM-S928B',
    Software: 'S928BXXU1AWF5',
    FNumber: 1.7,
    FocalLength: 23,
    LensModel: 'Samsung Galaxy S24 Ultra Main Camera 5.9mm f/1.7',
  },
  {
    Make: 'Google',
    Model: 'Pixel 7 Pro',
    Software: '13',
    FNumber: 1.85,
    FocalLength: 25,
    LensModel: 'Pixel 7 Pro back camera 6.81mm f/1.85',
  },
  {
    Make: 'Google',
    Model: 'Pixel 8 Pro',
    Software: '14',
    FNumber: 1.68,
    FocalLength: 24,
    LensModel: 'Pixel 8 Pro back camera 6.48mm f/1.68',
  },
];

const allProfiles: DeviceProfile[] = [...iphoneProfiles, ...androidProfiles];

export function getRandomProfile(): DeviceProfile {
  return allProfiles[Math.floor(Math.random() * allProfiles.length)];
}

// piexifjs rational format: [numerator, denominator]
function toRational(value: number, denominator = 100): [number, number] {
  return [Math.round(value * denominator), denominator];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Realistic shutter speeds (as [numerator, denominator])
const shutterSpeeds: [number, number][] = [
  [1, 60],
  [1, 80],
  [1, 100],
  [1, 125],
  [1, 160],
  [1, 200],
  [1, 250],
  [1, 320],
  [1, 400],
  [1, 500],
  [1, 640],
  [1, 800],
  [1, 1000],
  [1, 1250],
  [1, 1600],
  [1, 2000],
];

function formatDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}

export function generateRandomExifData(width: number, height: number): Record<string, Record<number, unknown>> {
  const profile = getRandomProfile();

  // Random time within last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const randomTime = new Date(
    sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime())
  );
  const dateTimeStr = formatDateTime(randomTime);

  const exposureTime = shutterSpeeds[Math.floor(Math.random() * shutterSpeeds.length)];
  const iso = randomInt(50, 800);

  return {
    '0th': {
      // ImageDescription not set
      271: profile.Make,                          // Make
      272: profile.Model,                         // Model
      274: 1,                                     // Orientation: 1 (normal)
      305: profile.Software,                      // Software
      306: dateTimeStr,                           // DateTime
      531: 1,                                     // YCbCrPositioning
    },
    Exif: {
      33434: exposureTime,                        // ExposureTime
      33437: toRational(profile.FNumber),         // FNumber
      34850: 2,                                   // ExposureProgram: 2 (normal program)
      34855: iso,                                 // ISOSpeedRatings
      36864: '0232',                              // ExifVersion
      36867: dateTimeStr,                         // DateTimeOriginal
      36868: dateTimeStr,                         // DateTimeDigitized
      37121: '\u0001\u0002\u0003\u0000',          // ComponentsConfiguration
      37380: toRational(0),                       // ExposureBiasValue: 0
      37383: 5,                                   // MeteringMode: 5 (pattern)
      37385: 24,                                  // Flash: 24 (no flash)
      37386: toRational(profile.FocalLength),     // FocalLength
      40960: '0100',                              // FlashpixVersion
      40961: 1,                                   // ColorSpace: 1 (sRGB)
      40962: width,                               // PixelXDimension
      40963: height,                              // PixelYDimension
      41986: 0,                                   // ExposureMode: 0 (auto)
      41987: 0,                                   // WhiteBalance: 0 (auto)
      41989: profile.FocalLength,                 // FocalLengthIn35mmFilm
      41990: 0,                                   // SceneCaptureType: 0 (standard)
      42036: profile.LensModel,                   // LensModel
    },
    GPS: {},
    '1st': {},
  };
}
