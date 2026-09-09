const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Original content length:', content.length);

// Check boundaries
const startTag = `{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_REPORT' || activeView === 'GUDANG_BUNDLING' || activeView === 'SCAN_ALL') && (
                            <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800">`;

if (!content.includes(startTag)) {
   console.error('startTag not found!');
   process.exit(1);
}

const endTag = `                                        </div>
                                     </>
                                  )}

                               </div>
                            </div>
                         )}

                         {/* BATCH DATA VIEW */}`;

if (!content.includes(endTag)) {
   console.error('endTag not found!');
   process.exit(1);
}

console.log('Both startTag and endTag successfully found!');
