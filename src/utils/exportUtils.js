const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZipArchive(files) {
  const encoder = new TextEncoder();
  const entries = files.map(file => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  let localTotalSize = 0;
  let centralTotalSize = 0;
  entries.forEach(entry => {
    localTotalSize += 30 + entry.nameBytes.length + entry.dataBytes.length;
    centralTotalSize += 46 + entry.nameBytes.length;
  });

  const buffer = new ArrayBuffer(localTotalSize + centralTotalSize + 22);
  const view = new DataView(buffer);
  const out = new Uint8Array(buffer);

  let localOffset = 0;
  entries.forEach(entry => {
    entry.localHeaderOffset = localOffset;
    view.setUint32(localOffset, 0x04034B50, true);
    view.setUint16(localOffset + 4, 20, true);
    view.setUint16(localOffset + 6, 0, true);
    view.setUint16(localOffset + 8, 0, true);
    view.setUint16(localOffset + 10, 0, true);
    view.setUint16(localOffset + 12, 0x21, true);
    view.setUint32(localOffset + 14, entry.crc, true);
    view.setUint32(localOffset + 18, entry.dataBytes.length, true);
    view.setUint32(localOffset + 22, entry.dataBytes.length, true);
    view.setUint16(localOffset + 26, entry.nameBytes.length, true);
    view.setUint16(localOffset + 28, 0, true);
    out.set(entry.nameBytes, localOffset + 30);
    out.set(entry.dataBytes, localOffset + 30 + entry.nameBytes.length);
    localOffset += 30 + entry.nameBytes.length + entry.dataBytes.length;
  });

  let centralOffset = localOffset;
  entries.forEach(entry => {
    view.setUint32(centralOffset, 0x02014B50, true);
    view.setUint16(centralOffset + 4, 20, true);
    view.setUint16(centralOffset + 6, 20, true);
    view.setUint16(centralOffset + 8, 0, true);
    view.setUint16(centralOffset + 10, 0, true);
    view.setUint16(centralOffset + 12, 0, true);
    view.setUint16(centralOffset + 14, 0x21, true);
    view.setUint32(centralOffset + 16, entry.crc, true);
    view.setUint32(centralOffset + 20, entry.dataBytes.length, true);
    view.setUint32(centralOffset + 24, entry.dataBytes.length, true);
    view.setUint16(centralOffset + 28, entry.nameBytes.length, true);
    view.setUint16(centralOffset + 30, 0, true);
    view.setUint16(centralOffset + 32, 0, true);
    view.setUint16(centralOffset + 34, 0, true);
    view.setUint16(centralOffset + 36, 0, true);
    view.setUint32(centralOffset + 38, 0, true);
    view.setUint32(centralOffset + 42, entry.localHeaderOffset, true);
    out.set(entry.nameBytes, centralOffset + 46);
    centralOffset += 46 + entry.nameBytes.length;
  });

  view.setUint32(centralOffset, 0x06054B50, true);
  view.setUint16(centralOffset + 4, 0, true);
  view.setUint16(centralOffset + 6, 0, true);
  view.setUint16(centralOffset + 8, entries.length, true);
  view.setUint16(centralOffset + 10, entries.length, true);
  view.setUint32(centralOffset + 12, centralTotalSize, true);
  view.setUint32(centralOffset + 16, localOffset, true);
  view.setUint16(centralOffset + 20, 0, true);

  return out;
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildDocxBytes(courseSections) {
  const bodyParagraphs = [];

  courseSections.forEach(course => {
    bodyParagraphs.push(
      `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(course.courseTitle)}</w:t></w:r></w:p>`
    );

    course.lessons.forEach(lesson => {
      bodyParagraphs.push('<w:p/>');
      bodyParagraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(`Video ${lesson.videoNumber}: ${lesson.lessonTitle}`)}</w:t></w:r></w:p>`
      );

      bodyParagraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading3"/><w:jc w:val="left"/></w:pPr><w:r><w:t>Notes</w:t></w:r></w:p>`
      );

      lesson.notes.forEach(noteLine => {
        const lines = String(noteLine).split(/\r?\n/);
        const runs = lines
          .map((line, idx) => `${idx > 0 ? '<w:br/>' : ''}<w:t xml:space="preserve">${escapeXml(line)}</w:t>`)
          .join('');
        bodyParagraphs.push(`<w:p><w:r><w:rPr><w:sz w:val="25"/><w:szCs w:val="25"/></w:rPr>${runs}</w:r></w:p>`);
      });
    });
  });

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:sz w:val="25"/>
      <w:szCs w:val="25"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="240" w:after="160"/>
      <w:jc w:val="center"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="36"/>
      <w:szCs w:val="36"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="200" w:after="100"/>
      <w:jc w:val="center"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="160" w:after="80"/>
      <w:jc w:val="left"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:bCs/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParagraphs.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return createZipArchive([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'word/_rels/document.xml.rels', content: documentRelsXml },
    { name: 'word/styles.xml', content: stylesXml },
    { name: 'word/document.xml', content: documentXml }
  ]);
}

export function exportNotesToWord(notesList = [], options = {}) {
  if (!notesList || notesList.length === 0) {
    alert('No notes available to export yet. Write some notes during lectures first!');
    return;
  }

  const normalizedOptions = typeof options === 'string'
    ? { courseTitle: options }
    : (options || {});

  const {
    courses = [],
    lessons = [],
    courseTitle = ''
  } = normalizedOptions;

  const courseMap = new Map(courses.map(course => [course.id, course]));
  const lessonMap = new Map(lessons.map(lesson => [lesson.id, lesson]));

  const courseGroups = new Map();
  notesList.forEach(note => {
    const cId = note.courseId || 'default';
    const lId = note.lessonId || 'default';

    if (!courseGroups.has(cId)) {
      courseGroups.set(cId, new Map());
    }
    const lessonGroups = courseGroups.get(cId);
    if (!lessonGroups.has(lId)) {
      lessonGroups.set(lId, []);
    }
    lessonGroups.get(lId).push(note);
  });

  const courseSections = [];

  courseGroups.forEach((lessonGroups, cId) => {
    const resolvedCourseTitle = courseMap.get(cId)?.title || courseTitle || 'Course Notes';
    const lessonItems = [];

    const sortedLessonEntries = Array.from(lessonGroups.entries()).sort(([lessonIdA], [lessonIdB]) => {
      const indexA = lessonMap.get(lessonIdA)?.index ?? Number.MAX_SAFE_INTEGER;
      const indexB = lessonMap.get(lessonIdB)?.index ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });

    sortedLessonEntries.forEach(([lId, lessonNotes], idx) => {
      if (!lessonNotes || lessonNotes.length === 0) return;

      const lesson = lessonMap.get(lId);
      const resolvedLessonTitle = lesson?.title || `Lesson ${lId}`;
      const videoNumber = lesson?.index ?? (idx + 1);
      const sortedNotes = [...lessonNotes].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

      const noteLines = sortedNotes.map(note => {
        const seconds = typeof note.timestamp === 'number' && note.timestamp >= 0 ? note.timestamp : 0;
        const timeStr = formatTime(seconds);
        const content = (note.text || note.content || '').trim();
        return `${content} [${timeStr}]`;
      });

      lessonItems.push({
        videoNumber,
        lessonTitle: resolvedLessonTitle,
        notes: noteLines
      });
    });

    if (lessonItems.length > 0) {
      courseSections.push({
        courseTitle: resolvedCourseTitle,
        lessons: lessonItems
      });
    }
  });

  const docxBytes = buildDocxBytes(courseSections);

  const firstCourseId = courseGroups.keys().next().value;
  const downloadBaseName = courseTitle
    || (courseGroups.size === 1 ? courseMap.get(firstCourseId)?.title : 'All_Courses')
    || 'Course';

  const sanitizedCourseName = downloadBaseName
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '_');

  const blob = new Blob([docxBytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${sanitizedCourseName}_notes.docx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportNotesToMarkdown = exportNotesToWord;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
