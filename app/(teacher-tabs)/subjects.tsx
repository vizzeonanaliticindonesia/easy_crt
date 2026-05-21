import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import {
  getTeacherSubjects,
  deleteTeacherSubject,
  createTeacherSubject,
  getAllSubjects,
} from '@/lib/services/teacher';
import {
  AppPageHeader,
  AppSectionHeader,
  AppEmptyState,
  AppButton,
  useResponsiveSpacing,
  AppIconButton,
  AppSearchSelectField,
} from '@/components/ui/AppPrimitives';
import { notify } from '@/lib/dialogs';
import { useIsFocused } from '@react-navigation/native';

export default function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const spacing = useResponsiveSpacing();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const isFocused = useIsFocused();
  const router = useRouter();

  // dropdown pakai string (biar sesuai component)
  const [subjectCategory, setSubjectCategory] = React.useState('All');
  const [subject, setSubject] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);        // punya teacher
  const [allSubjects, setAllSubjects] = React.useState<any[]>([]); // master

  // ========== GET TEACHER SUBJECT ==========
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await getTeacherSubjects();
      const payload =
        res?.data?.data ??
        res?.data ??
        res ??
        [];
      setData(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.log('LOAD ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ========== GET ALL SUBJECT ==========
  const loadAllSubjects = React.useCallback(async () => {
    try {
      const res: any = await getAllSubjects();

      console.log('API RESULT:', res);

      // if server returned JSON as string, try parse it
      let resolved: any = res;
      if (typeof resolved === 'string') {
        try {
          resolved = JSON.parse(resolved);
        } catch (err) {
          console.log('PARSE STRING ERROR:', err);
        }
      }

      // normalisasi response: support {data:{data:[]}} | {data:[]} | array
      const payload = resolved?.data?.data ?? resolved?.data ?? resolved ?? [];
      console.log('PARSED PAYLOAD:', payload);
      setAllSubjects(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.log('LOAD ALL SUBJECT ERROR:', err);
    }
  }, []);

  React.useEffect(() => {
    if (isFocused) {
      loadData();
      loadAllSubjects();
    }
  }, [isFocused]);

  React.useEffect(() => {
    console.log('ALL SUBJECTS FINAL:', allSubjects);
  }, [allSubjects]);

  // ========== CATEGORY OPTIONS (dari master) ==========
  const categoryOptions = React.useMemo(() => {
    if (!allSubjects || allSubjects.length === 0) {
      return [{ label: 'All', value: 'All' }];
    }

    const all = allSubjects
      .map((i) => i.category)
      .filter((c) => c && c.trim() !== ''); // 🔥 penting

    const unique = Array.from(new Set(all));

    return [
      { label: 'All', value: 'All' },
      ...unique.map((c) => ({
        label: c,
        value: c,
      })),
    ];
  }, [allSubjects]);

  // ========== SUBJECT OPTIONS (filter by category) ==========
  const subjectOptions = React.useMemo(() => {
    const list =
      subjectCategory === 'All'
        ? allSubjects
        : allSubjects.filter(
          (i) => i.category === subjectCategory
        );

    return list.map((i) => ({
      label: i.subject_name,
      value: String(i.id),
    }));
  }, [allSubjects, subjectCategory]);
  // reset subject kalau category berubah
  React.useEffect(() => {
    const values = subjectOptions.map((o) => o.value);
    if (subject && !values.includes(subject)) {
      setSubject('');
    }
  }, [subjectCategory, subjectOptions]);

  // ========== ADD ==========
const handleAdd = async () => {
  if (!subject) {
    notify('Error', 'Select subject');
    return;
  }

  try {
    const res: any = await createTeacherSubject([Number(subject)]);
    console.log('CREATE RESPONSE:', res);

    if (!res?.status) {
      notify('Error', res?.message || 'Failed');
      return;
    }

    await loadData(); // 🔥 refresh dari server

    notify('Success', 'Subject added');
    setSubject('');
  } catch (err) {
    console.log('CREATE ERROR:', err);
    notify('Error', 'Failed to add subject');
  }
};

  // ========== DELETE ==========
  const handleDelete = async (id: number) => {
    try {
      await deleteTeacherSubject(id);
      await loadData();
      notify('Success', 'Deleted successfully');
    } catch (err) {
      console.log('DELETE ERROR:', err);
      notify('Error', 'Failed to delete');
    }
  };

  const goBack = () => router.replace('/profile');

  // ========== UI ==========
return (
  <View style={{ flex: 1 }}>
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      refreshing={loading}
      onRefresh={loadData}

      // 🔥 SATU-SATUNYA PADDING DI SINI
      contentContainerStyle={{
        paddingHorizontal: spacing.horizontal,
        paddingBottom: spacing.bottomPadding,
      }}

      ListHeaderComponent={
        <>
          <View style={{ paddingTop: topPad + spacing.topOffset }} />

          {/* 🔹 BACK BUTTON */}
          <AppIconButton
            icon="arrow-back"
            onPress={goBack}
            size={spacing.iconGlyphSize}
            containerSize={spacing.iconButtonSize}
            style={{ marginBottom: 12 }}
          />

          {/* 🔹 HEADER */}
          <AppPageHeader
            title="Subjects"
            subtitle="Manage teacher subjects"
          />

          {/* 🔥 FORM (TANPA paddingHorizontal lagi) */}
          <View style={{ marginBottom: 16 }}>
            <AppSearchSelectField
              label="Category"
              value={subjectCategory}
              onChange={(val) => setSubjectCategory(val)}
              options={categoryOptions}
              placeholder="Select category"
              searchPlaceholder="Search category..."
              closeOnSelect
              containerStyle={styles.inputGroup}
            />

            <AppSearchSelectField
              label="Subject"
              value={subject}
              onChange={(val) => setSubject(val)}
              options={subjectOptions}
              placeholder="Select subject"
              searchPlaceholder="Search subject..."
              closeOnSelect
              containerStyle={styles.inputGroup}
            />

            <AppButton
              title="Add Subject"
              onPress={handleAdd}
              icon="add"
            />
          </View>

          {/* 🔹 SECTION */}
          <AppSectionHeader title="Subject List" />
        </>
      }

      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subject}>{item.subject_name}</Text>
              <Text style={{ color: '#999', fontSize: 12 }}>
                {item.category}
              </Text>
            </View>

            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons
                name="trash-outline"
                size={18}
                color={Colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      ListEmptyComponent={
        <AppEmptyState
          icon="book-outline"
          title="No subjects yet"
          subtitle="Add subject from the form above"
        />
      }
    />
  </View>
);
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 14,
  },

  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: Colors.surface,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  textContainer: {
    flex: 1,
    paddingRight: 10,
  },

  subject: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },

  category: {
    fontSize: 12,
    color: '#888',
  },

  deleteBtn: {
    backgroundColor: Colors.error,
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});