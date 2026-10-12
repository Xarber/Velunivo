import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('native_cache',Path(__file__).parents[1]/'scripts/native-cache-key.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class NativeCacheKeyTests(unittest.TestCase):
    def test_version_only_changes_reuse_native_inputs_but_real_changes_do_not(self):
        a={'version':'1.0.5','packages':{'':{'version':'1.0.5','dependencies':{'expo':'57'}}}}
        b={'version':'1.0.6','packages':{'':{'version':'1.0.6','dependencies':{'expo':'57'}}}}
        c={'expo':{'version':'1.0.5','ios':{'buildNumber':'1'},'android':{'versionCode':1}}}
        d={'expo':{'version':'1.0.6','ios':{'buildNumber':'2'},'android':{'versionCode':2}}}
        self.assertEqual(module.cache_key(a,c,{}),module.cache_key(b,d,{}))
        b['packages']['']['dependencies']['expo']='58'
        self.assertNotEqual(module.cache_key(a,c,{}),module.cache_key(b,d,{}))
        self.assertNotEqual(module.cache_key(a,c,{}),module.cache_key(a,c,{'module':'changed'}))
        d['expo']['ios']['usesAppleSignIn']=True
        self.assertNotEqual(module.cache_key(a,c,{}),module.cache_key(a,d,{}))
