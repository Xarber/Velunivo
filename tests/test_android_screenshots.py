import importlib.util,unittest,xml.etree.ElementTree as ET
from pathlib import Path
spec=importlib.util.spec_from_file_location('android_capture',Path(__file__).parents[1]/'scripts/android-screenshots.py');capture=importlib.util.module_from_spec(spec);spec.loader.exec_module(capture)
class NativeCaptureTests(unittest.TestCase):
    def test_bottom_tab_is_not_proof_of_the_requested_screen(self):
        bottom=ET.Element('node',{'package':capture.APP,'text':'Library','bounds':'[0,2650][400,2800]'})
        self.assertFalse(capture.page_matches('library',[bottom]))
        header=ET.Element('node',{'package':capture.APP,'text':'Library','bounds':'[30,100][400,200]'})
        self.assertTrue(capture.page_matches('library',[header,bottom]))
        overlay=ET.Element('node',{'package':'com.google.android.permissioncontroller'})
        self.assertFalse(capture.page_matches('library',[header,overlay]))
        accuracy=ET.Element('node',{'package':'com.google.android.gms'})
        self.assertFalse(capture.page_matches('library',[header,accuracy]))
    def test_launcher_text_never_counts_as_native_app_content(self):
        home=ET.Element('node',{'package':'com.google.android.apps.nexuslauncher','text':'Your ride','bounds':'[0,0][100,100]'})
        self.assertFalse(capture.page_matches('explore',[home]))
