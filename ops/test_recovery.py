import unittest
from recovery import copy_counts

class SnapshotCountsTest(unittest.TestCase):
    def test_copy_protocol_and_escaped_content(self):
        data=(b'-- snapshot\nCOPY cdr_render_qa.posts (id, body) FROM stdin;\n'
              b'1\tline one\\nline two\n'
              b'COPY public.not_a_table (value) FROM stdin;\n'
              b'3\t\\\\.\n\\.\n'
              b'COPY auth.users (id) FROM stdin;\n\\.\n')
        self.assertEqual(copy_counts(data),{('cdr_render_qa','posts'):3,('auth','users'):0})
    def test_truncation_is_not_accepted_as_a_valid_inventory(self):
        with self.assertRaises(RuntimeError):
            copy_counts(b'COPY cdr_render_qa.users (id) FROM stdin;\n1\n')

if __name__=='__main__':unittest.main()
