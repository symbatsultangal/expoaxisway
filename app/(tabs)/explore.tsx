import React from 'react';
import { StyleSheet, FlatList, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { volunteersApi } from '@/services/api/volunteers';
import { useQuery } from '@tanstack/react-query';

export default function ExploreScreen() {
  const { user, isVolunteer } = useAuth();
  const router = useRouter();

  const { data: feed, isLoading, refetch } = useQuery({
    queryKey: ['volunteerFeed'],
    queryFn: () => volunteersApi.getFeed(),
    enabled: !!user && isVolunteer,
  });

  const handleApply = async (requestId: string) => {
    try {
      await volunteersApi.apply(requestId, user?.id!);
      Alert.alert('Applied', 'You have offered to help!');
      refetch(); // Refresh feed
    } catch (error: any) {
      if (error.status === 409) {
        Alert.alert('Info', 'You already applied to this request.');
      } else {
        Alert.alert('Error', 'Failed to apply.');
      }
    }
  };

  if (!isVolunteer) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
           <ThemedText>This feed is for verified volunteers only.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.header}>Nearby Requests</ThemedText>
        }
        ListEmptyComponent={
          !isLoading ? <ThemedText style={styles.empty}>No open requests nearby.</ThemedText> : null
        }
        renderItem={({ item }) => (
          <Card 
            title={item.description}
            description={`Requester: ${item.requester?.full_name || 'Anonymous'}`}
          >
            <View style={styles.cardFooter}>
               <View>
                 <ThemedText style={styles.meta}>Complexity: {item.complexity_level}/5</ThemedText>
                 {item.is_emergency && <ThemedText style={styles.emergency}>EMERGENCY</ThemedText>}
               </View>
               <Button size="sm" onPress={() => handleApply(item.id)}>Offer Help</Button>
            </View>
          </Card>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  meta: {
    fontSize: 12,
    opacity: 0.7,
  },
  emergency: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
  },
});