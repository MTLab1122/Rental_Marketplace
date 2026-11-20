import fs from 'fs';

const extraReplacements = [
  { file: 'apps/web/app/properties/page.tsx', search: /<span>💡<\/span>\s*/g, replace: '' },
  { file: 'apps/web/app/properties/[slug]/page.tsx', search: /<div className="text-lg">📐<\/div>/g, replace: '' },
  { file: 'apps/web/app/referrals/page.tsx', search: /📋\s*/g, replace: '' },
  { file: 'apps/web/app/referrals/page.tsx', search: /⚖️\s*/g, replace: '' },
  { file: 'apps/web/components/ImageGallery.tsx', search: />✕<\/button>/g, replace: '>✕</button>' },
  { file: 'apps/web/components/InquiryModal.tsx', search: />✕<\/button>/g, replace: '>✕</button>' },
  { file: 'apps/web/components/ReportModal.tsx', search: />✕<\/button>/g, replace: '>✕</button>' },
  { file: 'apps/web/components/SaveSearchModal.tsx', search: />✕<\/button>/g, replace: '>✕</button>' },
];

for (const { file, search, replace } of extraReplacements) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log('Extra purge complete.');
