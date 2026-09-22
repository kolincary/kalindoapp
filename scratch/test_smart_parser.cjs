function formatBarcodeWithKnownPrefixes(barcode) {
  if (!barcode) return '';
  let clean = barcode.replace(/@/g, '').trim().toUpperCase();
  const prefixes = ['LXAD', 'JNEB', 'JNAP'];
  for (const p of prefixes) {
    if (clean.startsWith(`${p}-`)) return clean;
    if (clean.startsWith(p)) {
      const rest = clean.slice(p.length);
      if (rest.length > 0 && !rest.startsWith('-')) {
        clean = `${p}-${rest}`;
        return clean;
      }
    }
  }
  // SiCepat 10-digit without leading 00 -> 12-digit
  if (/^\d{10}$/.test(clean) && /^[4-9]/.test(clean)) {
    clean = '00' + clean;
  }
  return clean;
}

function parseLineToOrderAndBarcode(line) {
  if (!line) return { order_id: null, barcode: '' };
  const rawClean = line.replace(/@/g, '').trim();
  if (!rawClean) return { order_id: null, barcode: '' };

  const allParts = rawClean.split(/[\t\s]+/).filter(Boolean);
  if (allParts.length === 0) return { order_id: null, barcode: '' };
  if (allParts.length === 1) {
    return { order_id: null, barcode: formatBarcodeWithKnownPrefixes(allParts[0]) };
  }

  // Filter out line number tokens (e.g. "1", "2", "1.", "50.")
  const parts = allParts.filter((p, idx) => {
    if (idx === 0 && /^\d{1,4}\.?$/.test(p) && allParts.length > 2) return false;
    return true;
  });

  if (parts.length === 1) {
    return { order_id: null, barcode: formatBarcodeWithKnownPrefixes(parts[0]) };
  }

  const tok0 = parts[0].trim().toUpperCase();
  const tok1 = parts[1].trim().toUpperCase();

  const isBarcode = (t) => {
    return /^(SPXID|SPX|JP|JT|JX|JY|LXAD|JNAP|JNEB|00|10|11|12|TK|ID|NLID|CM|TJNT|SOC|BDG|JKT|SUB)/i.test(t) ||
           /\.(PDF|JPG|PNG)$/i.test(t) ||
           (/^00\d{8,12}$/.test(t)) ||
           (/^\d{10}$/.test(t) && /^[4-9]/.test(t));
  };

  const isOrderId = (t) => {
    return /^(INV\/|260|261|262|250|251|ORD|SO)/i.test(t) ||
           (/^\d{14,22}$/.test(t)) ||
           (/^2609\w+$/i.test(t));
  };

  // Case 1: tok0 is OrderID and tok1 is Barcode (Standard)
  if (isOrderId(tok0) && !isOrderId(tok1)) {
    return { order_id: parts[0], barcode: formatBarcodeWithKnownPrefixes(parts[1]) };
  }

  // Case 2: tok0 is Barcode and tok1 is OrderID (Reversed!)
  if (isBarcode(tok0) && (isOrderId(tok1) || !isBarcode(tok1))) {
    return { order_id: parts[1], barcode: formatBarcodeWithKnownPrefixes(parts[0]) };
  }

  // Case 3: tok1 is clearly Barcode
  if (isBarcode(tok1) && !isBarcode(tok0)) {
    return { order_id: parts[0], barcode: formatBarcodeWithKnownPrefixes(parts[1]) };
  }

  // Fallback default: parts[0] is order_id, parts[1] is barcode
  return { order_id: parts[0], barcode: formatBarcodeWithKnownPrefixes(parts[1]) };
}

// Tests
const testCases = [
  "260922P4QUW6MD SPXID062373762219",
  "SPXID062373762219 260922P4QUW6MD",
  "1 260922P4QUW6MD SPXID062373762219",
  "1. SPXID062373762219 260922P4QUW6MD",
  "586111343085389566 JY1765854722",
  "JY1765854722 586111343085389566",
  "4663461160",
  "260922P90YRH5T 4663461160",
  "4663461160 260922P90YRH5T",
  "LXAD1234567890 260922P90YRH5T",
  "260922P90YRH5T LXAD1234567890"
];

console.log("=== Testing parseLineToOrderAndBarcode ===");
for (const tc of testCases) {
  const res = parseLineToOrderAndBarcode(tc);
  console.log(`Input:  "${tc}"`);
  console.log(`Result: order_id="${res.order_id}", barcode="${res.barcode}"\n`);
}
